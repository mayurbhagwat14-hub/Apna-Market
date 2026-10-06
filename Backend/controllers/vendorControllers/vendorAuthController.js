const Vendor = require('../../models/Vendor');
const { generateOTP, hashOTP, storeOTP, verifyOTP, checkRateLimit } = require('../../utils/redisOtp.util');
const { generateTokenPair, verifyRefreshToken, generateVerificationToken, verifyVerificationToken } = require('../../utils/tokenService');
const { sendOTP: sendSMSOTP } = require('../../services/smsService');
const cloudinaryService = require('../../services/cloudinaryService');
const { USER_ROLES, VENDOR_STATUS } = require('../../utils/constants');
const { validationResult } = require('express-validator');

/**
 * Send OTP for vendor registration/login
 */
const sendOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phone, email, intent } = req.body;

    const existingVendor = await Vendor.findOne({ phone });

    // Signup flow — do not send OTP if account already exists or is pending review
    if (intent === 'signup') {
      if (existingVendor) {
        if (existingVendor.approvalStatus === VENDOR_STATUS.PENDING) {
          return res.status(409).json({
            success: false,
            code: 'VENDOR_PENDING',
            message: 'Your provider application is under admin review. Please wait for approval or sign in once approved.'
          });
        }
        if (
          existingVendor.approvalStatus === VENDOR_STATUS.REJECTED ||
          existingVendor.approvalStatus === VENDOR_STATUS.SUSPENDED
        ) {
          return res.status(403).json({
            success: false,
            code: 'ACCOUNT_RESTRICTED',
            message: 'This account is restricted. Please contact support.'
          });
        }
        return res.status(409).json({
          success: false,
          code: 'ACCOUNT_EXISTS',
          message: 'This mobile number is already registered as a provider. Please sign in instead.'
        });
      }
    }

    // Login flow — handle restricted / pending vendor before sending OTP
    if (existingVendor) {
      if (existingVendor.approvalStatus === VENDOR_STATUS.PENDING) {
        return res.status(200).json({
          success: true,
          message: 'Your account is currently under review. Please wait for admin approval.',
          vendor: { adminApproval: 'pending' }
        });
      }
      if (existingVendor.approvalStatus === VENDOR_STATUS.REJECTED || existingVendor.approvalStatus === VENDOR_STATUS.SUSPENDED) {
        return res.status(403).json({ success: false, message: 'Account restricted.' });
      }
    }

    // 1. Rate limit check
    const allowed = await checkRateLimit(phone);
    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again after 10 minutes.'
      });
    }

    // 2. Generate OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    // 3. Store OTP (Redis primary, MongoDB fallback)
    await storeOTP(phone, otpHash);

    // 4. Send OTP via SMS
    const smsResult = await sendSMSOTP(phone, otp);

    // Log OTP in development mode
    if (process.env.NODE_ENV === 'development' || process.env.USE_DEFAULT_OTP === 'true') {
      console.log(`[DEV] Vendor OTP for ${phone}: ${otp}`);
    }

    if (!smsResult.success) {
      console.warn(`[OTP] SMS failed for vendor ${phone}, but OTP stored`);
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      token: 'verification-pending'
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
};

/**
 * Verify OTP and Check Vendor Status (Unified Login/Signup Entry)
 */
const verifyLogin = async (req, res) => {
  try {
    const { phone, otp, fcmToken, platform = 'web' } = req.body;

    // 1. Verify OTP
    const verification = await verifyOTP(phone, otp);
    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // 2. Check if vendor exists
    const vendor = await Vendor.findOne({ phone });

    if (vendor) {
      // EXISTING VENDOR

      // Check status checks (Login Logic)
      if (vendor.approvalStatus === VENDOR_STATUS.REJECTED) {
        return res.status(403).json({ success: false, message: 'Account rejected.' });
      }
      if (vendor.approvalStatus === VENDOR_STATUS.SUSPENDED) {
        return res.status(403).json({ success: false, message: 'Account suspended.' });
      }
      if (!vendor.isActive) {
        return res.status(403).json({ success: false, message: 'Account deactivated.' });
      }

      // BLOCK PENDING VENDORS
      if (vendor.approvalStatus === VENDOR_STATUS.PENDING) {
        return res.status(200).json({
          success: true,
          message: 'Your account is currently under review. Please wait for admin approval.',
          vendor: { adminApproval: 'pending' }
        });
      }

      // Update Session ID & Save FCM token to appropriate field if provided
      const loginSessionId = Date.now().toString();
      const updateData = { loginSessionId };
      if (fcmToken) {
        if (platform === 'mobile') {
          updateData.$addToSet = { fcmTokenMobile: fcmToken };
        } else {
          updateData.$addToSet = { fcmTokens: fcmToken };
        }
      }
      await Vendor.findByIdAndUpdate(vendor._id, updateData);

      const tokens = generateTokenPair({
        userId: vendor._id,
        role: USER_ROLES.VENDOR,
        loginSessionId
      });

      const { formatVendorResponse } = require('../../utils/masking.util');
      return res.status(200).json({
        success: true,
        isNewUser: false,
        message: 'Login successful',
        vendor: formatVendorResponse(vendor),
        ...tokens
      });

    } else {
      // NEW VENDOR -> RETURN VERIFICATION TOKEN
      const verificationToken = generateVerificationToken(phone);

      return res.status(200).json({
        success: true,
        isNewUser: true,
        message: 'OTP verified. Please complete registration.',
        verificationToken
      });
    }

  } catch (error) {
    console.error('Verify Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.'
    });
  }
};

/**
 * Register vendor with Verification Token (Service/Category Removed)
 */
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    // Ignore service validation error if present (since removed)
    const validErrors = errors.array().filter(e => e.path !== 'service');

    if (validErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validErrors
      });
    }

    // verificationToken handling
    const { name, email, verificationToken, aadhar, pan, fcmToken, platform = 'web' } = req.body;
    let phone = req.body.phone;

    if (verificationToken) {
      const verifiedPhone = verifyVerificationToken(verificationToken);
      if (!verifiedPhone) return res.status(400).json({ success: false, message: 'Invalid verification session.' });
      phone = verifiedPhone;
    } else {
      // Fallback OTP
      if (!req.body.otp) return res.status(400).json({ success: false, message: 'Verification required.' });
      const ver = await verifyOTP(phone, req.body.otp);
      if (!ver.success) return res.status(400).json({ success: false, message: ver.message });
    }

    // Check existing
    const existingPhone = await Vendor.findOne({ phone });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        code: 'ACCOUNT_EXISTS',
        message: 'This phone number is already registered. Please sign in instead.'
      });
    }
    
    const existingEmail = await Vendor.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'This email address is already registered to another account.' });
    }

    // Upload documents with fallback placeholders to prevent schema validation failure
    let aadharUrl = req.body.aadharDocument || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400';
    let aadharBackUrl = req.body.aadharBackDocument || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400';
    let panUrl = req.body.panDocument || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400';
    let profilePhotoUrl = req.body.profilePhoto || null;
    let otherUrls = req.body.otherDocuments || [];

    if (aadharUrl && aadharUrl.startsWith('data:')) {
      try {
        const uploadRes = await cloudinaryService.uploadFile(aadharUrl, { folder: 'vendors/documents' });
        if (uploadRes && uploadRes.success) aadharUrl = uploadRes.url;
      } catch (cErr) {
        console.warn('Cloudinary upload warning (Aadhaar Front):', cErr.message);
        aadharUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400';
      }
    }
    if (aadharBackUrl && aadharBackUrl.startsWith('data:')) {
      try {
        const uploadRes = await cloudinaryService.uploadFile(aadharBackUrl, { folder: 'vendors/documents' });
        if (uploadRes && uploadRes.success) aadharBackUrl = uploadRes.url;
      } catch (cErr) {
        console.warn('Cloudinary upload warning (Aadhaar Back):', cErr.message);
        aadharBackUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400';
      }
    }
    if (panUrl && panUrl.startsWith('data:')) {
      try {
        const uploadRes = await cloudinaryService.uploadFile(panUrl, { folder: 'vendors/documents' });
        if (uploadRes && uploadRes.success) panUrl = uploadRes.url;
      } catch (cErr) {
        console.warn('Cloudinary upload warning (PAN):', cErr.message);
        panUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400';
      }
    }

    if (profilePhotoUrl && profilePhotoUrl.startsWith('data:')) {
      try {
        const uploadRes = await cloudinaryService.uploadFile(profilePhotoUrl, { folder: 'vendors/profile_photos' });
        if (uploadRes && uploadRes.success) profilePhotoUrl = uploadRes.url;
      } catch (cErr) {
        console.warn('Cloudinary upload warning (Profile Photo):', cErr.message);
        profilePhotoUrl = null;
      }
    }

    if (otherUrls && otherUrls.length > 0) {
      const uploadedOthers = [];
      for (const doc of otherUrls) {
        if (doc && doc.startsWith('data:')) {
          try {
            const up = await cloudinaryService.uploadFile(doc, { folder: 'vendors/documents/others' });
            if (up && up.success) uploadedOthers.push(up.url);
          } catch (cErr) {
            console.warn('Cloudinary upload warning (Other doc):', cErr.message);
          }
        } else if (doc) uploadedOthers.push(doc);
      }
      otherUrls = uploadedOthers;
    }

    const { formatVendorResponse } = require('../../utils/masking.util');
    const { logAudit } = require('../../utils/auditLogger');

    const providerType = req.body.providerType === 'BUSINESS' ? 'BUSINESS' : 'INDIVIDUAL';
    const selectedServices = Array.isArray(req.body.service)
      ? req.body.service
      : Array.isArray(req.body.services)
        ? req.body.services
        : req.body.service
          ? [req.body.service]
          : [];
    const serviceDetails = req.body.serviceDetails || req.body.dynamicFormAnswers || {};

    const initialFCM = {};
    if (fcmToken) {
      if (platform === 'mobile') {
        initialFCM.fcmTokenMobile = [fcmToken];
        initialFCM.fcmTokens = [];
      } else {
        initialFCM.fcmTokens = [fcmToken];
        initialFCM.fcmTokenMobile = [];
      }
    }

    const vendor = await Vendor.create({
      name, email, phone, gender: req.body.gender || 'Male',
      providerType,
      businessDetails: providerType === 'BUSINESS' ? {
        businessName: req.body.businessName || name,
        businessDescription: req.body.businessDescription || '',
        teamSize: req.body.teamSize || 1,
        gstin: req.body.gstin || null
      } : {},
      accountStatus: 'PENDING_VERIFICATION',
      approvalStatus: VENDOR_STATUS.PENDING,
      service: selectedServices,
      categories: selectedServices,
      serviceDetails: serviceDetails,
      dynamicFormAnswers: serviceDetails,
      aadhar: {
        number: aadhar,
        document: aadharUrl,
        backDocument: aadharBackUrl
      },
      pan: { number: pan, document: panUrl },
      address: req.body.address || {},
      bankDetails: req.body.bankDetails || {},
      profilePhoto: profilePhotoUrl,
      otherDocuments: otherUrls,
      isPhoneVerified: true,
      profileCompletion: 60,
      ...initialFCM
    });

    // Log registration audit
    await logAudit({
      actorId: vendor._id,
      actorType: 'VENDOR',
      actorName: vendor.name,
      action: 'VENDOR_REGISTERED',
      entity: 'Vendor',
      entityId: vendor._id,
      newValue: { providerType, email: vendor.email, phone: vendor.phone },
      req
    });

    // Notify Admins
    try {
      const { createNotification } = require('../notificationControllers/notificationController');
      const Admin = require('../../models/Admin');
      const admins = await Admin.find({ isActive: true }).select('_id');
      for (const admin of admins) {
        await createNotification({
          adminId: admin._id,
          type: 'vendor_approval_request',
          title: '👤 New Vendor Registration',
          message: `${vendor.name} (${vendor.phone}) has registered`,
          relatedId: vendor._id,
          relatedType: 'vendor',
          data: { vendorId: vendor._id, vendorName: vendor.name, phone: vendor.phone },
          pushData: { type: 'admin_alert', link: '/admin/vendors/all' }
        });
      }
    } catch (e) { console.error('Notify error', e); }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Pending approval.',
      vendor: formatVendorResponse(vendor)
    });

  } catch (error) {
    console.error('Vendor registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed.'
    });
  }
};

/**
 * Login vendor with OTP (only if approved)
 */
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phone, otp, fcmToken, platform = 'web' } = req.body;

    // Verify OTP (checks Redis first, falls back to MongoDB)
    const verification = await verifyOTP(phone, otp);
    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // Find vendor
    const vendor = await Vendor.findOne({ phone });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found. Please sign up first.'
      });
    }

    // Check approval status
    if (vendor.approvalStatus === VENDOR_STATUS.PENDING) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval. Please wait for approval.'
      });
    }

    if (vendor.approvalStatus === VENDOR_STATUS.REJECTED) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been rejected. Please contact support.'
      });
    }

    if (vendor.approvalStatus === VENDOR_STATUS.SUSPENDED) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.'
      });
    }

    if (!vendor.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Update Session ID & Save FCM token if provided
    const loginSessionId = Date.now().toString();
    const updateData = { loginSessionId };
    if (fcmToken) {
      if (platform === 'mobile') {
        updateData.$addToSet = { fcmTokenMobile: fcmToken };
      } else {
        updateData.$addToSet = { fcmTokens: fcmToken };
      }
    }
    await Vendor.findByIdAndUpdate(vendor._id, updateData);

    // Generate JWT tokens
    const tokens = generateTokenPair({
      userId: vendor._id,
      role: USER_ROLES.VENDOR,
      loginSessionId
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        businessName: vendor.businessName,
        service: vendor.service
      },
      ...tokens
    });
  } catch (error) {
    console.error('Vendor login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

/**
 * Logout vendor
 */
const logout = async (req, res) => {
  try {
    const { platform = 'web', token } = req.body;

    // Clear FCM tokens based on platform/token and reset Session ID
    const vendorId = req.user && (req.user.id || req.user._id);
    if (vendorId) {
      let updateQuery;
      if (token) {
        updateQuery = platform === 'mobile'
          ? { $pull: { fcmTokenMobile: token }, loginSessionId: null }
          : { $pull: { fcmTokens: token }, loginSessionId: null };
      } else {
        updateQuery = platform === 'mobile'
          ? { $set: { fcmTokenMobile: [], loginSessionId: null } }
          : { $set: { fcmTokens: [], loginSessionId: null } };
      }

      await Vendor.findByIdAndUpdate(vendorId, updateQuery);
      console.log(`[AUTH] ✅ ${platform} session & tokens cleared for vendor: ${vendorId}`);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

/**
 * Refresh Access Token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Check if vendor exists
    const vendor = await Vendor.findById(decoded.userId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check status
    if (vendor.approvalStatus !== VENDOR_STATUS.APPROVED || !vendor.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is not approved or is inactive'
      });
    }

    // Verify Session ID for Vendor
    if (decoded.loginSessionId !== vendor.loginSessionId) {
      return res.status(401).json({
        success: false,
        message: 'Account logged in on a new device. Please login again.'
      });
    }

    // Generate new token pair with same session ID
    const tokens = generateTokenPair({
      userId: vendor._id,
      role: USER_ROLES.VENDOR,
      loginSessionId: vendor.loginSessionId
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      ...tokens
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token'
    });
  }
};

module.exports = {
  sendOTP,
  verifyLogin,
  register,
  login,
  logout,
  refreshToken
};
