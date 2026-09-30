/**
 * Mask Aadhaar number: 123456789012 -> XXXX XXXX 9012
 */
const maskAadhaar = (num) => {
  if (!num) return null;
  const str = String(num).replace(/\D/g, '');
  if (str.length < 4) return 'XXXX XXXX XXXX';
  const last4 = str.slice(-4);
  return `XXXX XXXX ${last4}`;
};

/**
 * Mask PAN number: ABCDE1234F -> XXXXX1234X
 */
const maskPAN = (pan) => {
  if (!pan) return null;
  const str = String(pan).toUpperCase().trim();
  if (str.length < 10) return 'XXXXX0000X';
  return `XXXXX${str.slice(5, 9)}X`;
};

/**
 * Mask Bank Account number: 123456789012 -> XXXXXXXX9012
 */
const maskBankAccount = (accountNo) => {
  if (!accountNo) return null;
  const str = String(accountNo).trim();
  if (str.length < 4) return 'XXXX';
  return 'X'.repeat(Math.max(0, str.length - 4)) + str.slice(-4);
};

/**
 * Clean Vendor Profile for public or provider response without exposing unmasked KYC
 */
const formatVendorResponse = (vendor) => {
  if (!vendor) return null;
  const v = vendor.toObject ? vendor.toObject() : vendor;

  const maskedAadhaarNumber = maskAadhaar(v.aadhar?.number || v.aadharNumber);
  const maskedPanNumber = maskPAN(v.pan?.number || v.panNumber);
  const maskedBankAccount = maskBankAccount(v.bankDetails?.accountNumber);

  return {
    id: v._id,
    name: v.name,
    email: v.email,
    phone: v.phone,
    providerType: v.providerType || 'INDIVIDUAL',
    accountStatus: v.accountStatus || 'PENDING_VERIFICATION',
    approvalStatus: v.approvalStatus,
    rejectedReason: v.rejectedReason,
    profilePhoto: v.profilePhoto,
    businessDetails: v.businessDetails || {},
    profileCompletion: v.profileCompletion || 50,
    rating: v.rating || 0,
    totalJobs: v.totalJobs || 0,
    isAvailableNow: v.isAvailableNow ?? true,
    address: v.address || {},
    bankDetails: {
      accountHolderName: v.bankDetails?.accountHolderName || null,
      bankName: v.bankDetails?.bankName || null,
      ifscCode: v.bankDetails?.ifscCode || null,
      accountNumber: maskedBankAccount,
      upiId: v.bankDetails?.upiId || null,
      isVerified: v.bankDetails?.isVerified || false
    },
    kycSummary: {
      aadhar: {
        number: maskedAadhaarNumber,
        hasFront: Boolean(v.aadhar?.document),
        hasBack: Boolean(v.aadhar?.backDocument)
      },
      pan: {
        number: maskedPanNumber,
        hasDocument: Boolean(v.pan?.document)
      }
    }
  };
};

module.exports = {
  maskAadhaar,
  maskPAN,
  maskBankAccount,
  formatVendorResponse
};
