const mongoose = require('mongoose');
const { formatVendorResponse } = require('../../utils/masking.util');
const { logAudit } = require('../../utils/auditLogger');
const ServiceListing = require('../../models/ServiceListing');
const Vendor = require('../../models/Vendor');
const cloudinaryService = require('../../services/cloudinaryService');

/**
 * Calculate dynamic profile completion percentage
 */
const calculateProfileCompletion = async (vendor) => {
  let score = 0;
  if (vendor.name && vendor.email && vendor.phone && (vendor.address?.fullAddress || vendor.address?.city)) score += 20;
  if (vendor.profilePhoto) score += 10;
  if (vendor.aadhar?.document && vendor.pan?.document) score += 30;
  
  const serviceCount = await ServiceListing.countDocuments({ vendorId: vendor._id });
  if (serviceCount > 0) score += 20;

  if (vendor.bankDetails?.accountNumber && vendor.bankDetails?.accountHolderName) score += 10;
  if (vendor.businessHours || vendor.isAvailableNow !== undefined) score += 10;

  return score;
};

/**
 * Get vendor profile
 */
const getProfile = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const vendor = await Vendor.findById(vendorId).select('-password -__v');
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const completionScore = await calculateProfileCompletion(vendor);
    if (vendor.profileCompletion !== completionScore) {
      vendor.profileCompletion = completionScore;
      await vendor.save();
    }

    let rating = vendor.rating || 0;
    const Booking = require('../../models/Booking');

    if (rating === 0) {
      const [ratingData] = await Booking.aggregate([
        { $match: { vendorId: new mongoose.Types.ObjectId(vendorId), rating: { $ne: null } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]);
      rating = ratingData ? ratingData.avgRating : 0;
    }

    const totalJobs = await Booking.countDocuments({ vendorId });
    const completedJobs = await Booking.countDocuments({ vendorId, status: 'completed' });
    const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

    const formatted = formatVendorResponse(vendor);

    res.status(200).json({
      success: true,
      vendor: {
        ...formatted,
        skills: vendor.skills || [],
        totalJobs,
        completedJobs,
        completionRate,
        businessHours: vendor.businessHours || {},
        settings: vendor.settings || {},
        isPhoneVerified: vendor.isPhoneVerified || false,
        isEmailVerified: vendor.isEmailVerified || false
      }
    });
  } catch (error) {
    console.error('Get vendor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile. Please try again.'
    });
  }
};

/**
 * Update personal profile section
 */
const updatePersonal = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { name, bio, profilePhoto, address, skills } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    if (name) vendor.name = name.trim();
    if (bio !== undefined) vendor.businessDetails = { ...vendor.businessDetails, businessDescription: bio };
    if (skills && Array.isArray(skills)) vendor.skills = skills;

    if (profilePhoto && profilePhoto.startsWith('data:')) {
      const uploadRes = await cloudinaryService.uploadFile(profilePhoto, { folder: 'vendors/profiles' });
      if (uploadRes.success) vendor.profilePhoto = uploadRes.url;
    } else if (profilePhoto) {
      vendor.profilePhoto = profilePhoto;
    }

    if (address) {
      vendor.address = { ...vendor.address, ...address };
      if (address.lat && address.lng) {
        vendor.geoLocation = { type: 'Point', coordinates: [parseFloat(address.lng), parseFloat(address.lat)] };
      }
    }

    vendor.profileCompletion = await calculateProfileCompletion(vendor);
    await vendor.save();

    await logAudit({ actorId: vendor._id, actorType: 'VENDOR', actorName: vendor.name, action: 'PROFILE_UPDATED', entity: 'Vendor', entityId: vendor._id, req });

    res.status(200).json({ success: true, message: 'Personal profile updated', vendor: formatVendorResponse(vendor) });
  } catch (error) {
    console.error('Update personal profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update personal details' });
  }
};

/**
 * Update business details
 */
const updateBusiness = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { providerType, businessName, businessLogo, businessDescription, teamSize, gstin, businessAddress } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    if (providerType) vendor.providerType = providerType;
    let logoUrl = vendor.businessDetails?.businessLogo;

    if (businessLogo && businessLogo.startsWith('data:')) {
      const uploadRes = await cloudinaryService.uploadFile(businessLogo, { folder: 'vendors/business' });
      if (uploadRes.success) logoUrl = uploadRes.url;
    } else if (businessLogo) {
      logoUrl = businessLogo;
    }

    vendor.businessDetails = {
      businessName: businessName !== undefined ? businessName : vendor.businessDetails?.businessName,
      businessLogo: logoUrl,
      businessDescription: businessDescription !== undefined ? businessDescription : vendor.businessDetails?.businessDescription,
      teamSize: teamSize || vendor.businessDetails?.teamSize || 1,
      gstin: gstin !== undefined ? gstin : vendor.businessDetails?.gstin,
      businessAddress: businessAddress !== undefined ? businessAddress : vendor.businessDetails?.businessAddress
    };

    vendor.profileCompletion = await calculateProfileCompletion(vendor);
    await vendor.save();

    await logAudit({ actorId: vendor._id, actorType: 'VENDOR', actorName: vendor.name, action: 'BUSINESS_DETAILS_UPDATED', entity: 'Vendor', entityId: vendor._id, req });

    res.status(200).json({ success: true, message: 'Business details updated', vendor: formatVendorResponse(vendor) });
  } catch (error) {
    console.error('Update business details error:', error);
    res.status(500).json({ success: false, message: 'Failed to update business details' });
  }
};

/**
 * Update bank & payout details (Triggers admin verification requirement)
 */
const updateBank = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { accountHolderName, accountNumber, ifscCode, bankName, upiId } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    vendor.bankDetails = {
      accountHolderName: accountHolderName ? accountHolderName.trim() : vendor.bankDetails?.accountHolderName,
      accountNumber: accountNumber ? accountNumber.trim() : vendor.bankDetails?.accountNumber,
      ifscCode: ifscCode ? ifscCode.trim().toUpperCase() : vendor.bankDetails?.ifscCode,
      bankName: bankName ? bankName.trim() : vendor.bankDetails?.bankName,
      upiId: upiId ? upiId.trim() : vendor.bankDetails?.upiId,
      isVerified: false // Reset verification status when bank details change
    };

    vendor.profileCompletion = await calculateProfileCompletion(vendor);
    await vendor.save();

    await logAudit({ actorId: vendor._id, actorType: 'VENDOR', actorName: vendor.name, action: 'BANK_DETAILS_UPDATED', entity: 'Vendor', entityId: vendor._id, req });

    res.status(200).json({ success: true, message: 'Bank details updated successfully', vendor: formatVendorResponse(vendor) });
  } catch (error) {
    console.error('Update bank details error:', error);
    res.status(500).json({ success: false, message: 'Failed to update bank details' });
  }
};

/**
 * Update availability & working hours
 */
const updateAvailability = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { isAvailableNow, businessHours, blockedDates, holidayDates, availability } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    if (isAvailableNow !== undefined) vendor.isAvailableNow = Boolean(isAvailableNow);
    if (availability) vendor.availability = availability;
    if (businessHours) vendor.businessHours = { ...vendor.businessHours, ...businessHours };
    if (blockedDates && Array.isArray(blockedDates)) vendor.blockedDates = blockedDates;
    if (holidayDates && Array.isArray(holidayDates)) vendor.holidayDates = holidayDates;

    vendor.profileCompletion = await calculateProfileCompletion(vendor);
    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Availability updated',
      availability: {
        isAvailableNow: vendor.isAvailableNow,
        availability: vendor.availability,
        businessHours: vendor.businessHours,
        blockedDates: vendor.blockedDates,
        holidayDates: vendor.holidayDates
      }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to update availability' });
  }
};

/**
 * Update vendor profile (Legacy compatibility)
 */
const updateProfile = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { name, businessName, address, profilePhoto, serviceCategory, skills, serviceRange } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    if (name) vendor.name = name.trim();
    if (businessName !== undefined) {
      if (!vendor.businessDetails) vendor.businessDetails = {};
      vendor.businessDetails.businessName = businessName ? businessName.trim() : null;
    }
    if (address) {
      if (typeof address === 'string') {
        vendor.address = { ...vendor.address, fullAddress: address };
      } else {
        vendor.address = { ...vendor.address, ...address };
        if (address.lat && address.lng) {
          vendor.geoLocation = { type: 'Point', coordinates: [parseFloat(address.lng), parseFloat(address.lat)] };
        }
      }
    }

    if (profilePhoto && profilePhoto.startsWith('data:')) {
      const uploadRes = await cloudinaryService.uploadFile(profilePhoto, { folder: 'vendors/profiles' });
      if (uploadRes.success) vendor.profilePhoto = uploadRes.url;
    } else if (profilePhoto) {
      vendor.profilePhoto = profilePhoto;
    }

    if (serviceCategory !== undefined) {
      vendor.service = Array.isArray(serviceCategory) ? serviceCategory : [serviceCategory];
    }
    if (serviceRange !== undefined) {
      if (!vendor.settings) vendor.settings = {};
      vendor.settings.serviceRange = Number(serviceRange) || 10;
    }
    if (skills !== undefined) vendor.skills = Array.isArray(skills) ? skills : [];

    vendor.profileCompletion = await calculateProfileCompletion(vendor);
    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      vendor: formatVendorResponse(vendor)
    });
  } catch (error) {
    console.error('Update vendor profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

/**
 * Update vendor address
 */
const updateAddress = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { fullAddress, lat, lng } = req.body;

    if (!fullAddress || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Full address and coordinates are required' });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    vendor.address = {
      ...vendor.address,
      fullAddress: fullAddress.trim(),
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    };

    vendor.geoLocation = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
    await vendor.save();

    res.status(200).json({ success: true, message: 'Address updated successfully', address: vendor.address });
  } catch (error) {
    console.error('Update vendor address error:', error);
    res.status(500).json({ success: false, message: 'Failed to update address' });
  }
};

/**
 * Update vendor real-time location
 */
const updateLocation = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required' });
    }

    await Vendor.findByIdAndUpdate(vendorId, {
      location: { lat, lng, updatedAt: new Date() },
      geoLocation: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] }
    });

    res.status(200).json({ success: true, message: 'Location updated' });
  } catch (error) {
    console.error('Vendor location update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePersonal,
  updateBusiness,
  updateBank,
  updateAvailability,
  updateAddress,
  updateLocation
};

