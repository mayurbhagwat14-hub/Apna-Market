const Vendor = require('../../models/Vendor');
const ServiceListing = require('../../models/ServiceListing');
const cloudinaryService = require('../../services/cloudinaryService');

const isApprovedMarketingItem = (item) => Boolean(item && item.reviewStatus === 'approved');

const syncApprovedMarketingToListing = async (vendorId, vendor = null) => {
  const sourceVendor = vendor || await Vendor.findById(vendorId);
  if (!sourceVendor) return;

  const listings = await ServiceListing.find({ vendorId });
  if (!listings.length) return;

  const approvedPhotos = (sourceVendor.shopPhotos || [])
    .filter(isApprovedMarketingItem)
    .map((photo) => photo.url)
    .filter(Boolean);

  const activeOffer = (sourceVendor.offers || []).find((offer) => isApprovedMarketingItem(offer) && offer.isActive);
  const realCoverImage = approvedPhotos[0] || activeOffer?.imageUrl;

  for (const listing of listings) {
    listing.portfolioPhotos = Array.from(new Set([
      ...approvedPhotos,
      ...(activeOffer?.imageUrl ? [activeOffer.imageUrl] : []),
      ...(listing.portfolioPhotos || []).filter((url) => !url.includes('/vendors/shop-photos/'))
    ]));

    listing.dynamicFormAnswers = listing.dynamicFormAnswers || {};
    if (realCoverImage) {
      listing.dynamicFormAnswers.coverImage = realCoverImage;
    }

    if (activeOffer) {
      listing.dynamicFormAnswers.offer = {
        id: activeOffer._id?.toString?.() || activeOffer.id,
        title: activeOffer.title,
        tagline: activeOffer.tagline || '',
        badge: activeOffer.discountBadge || `${activeOffer.discountPercent || 20}% OFF`,
        discountBadge: activeOffer.discountBadge || `${activeOffer.discountPercent || 20}% OFF`,
        code: activeOffer.code || 'APNA20',
        image: activeOffer.imageUrl,
        imageUrl: activeOffer.imageUrl,
        discountPercent: activeOffer.discountPercent || 0,
        discountAmount: activeOffer.discountAmount || 0,
        validTill: activeOffer.validTill,
        terms: activeOffer.terms || ''
      };
    } else {
      delete listing.dynamicFormAnswers.offer;
    }

    await listing.save();
  }
};

/**
 * GET /api/vendors/marketing
 * Fetches vendor marketing dashboard data: photos, offers, stats, visibility
 */
const getMarketingOverview = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const vendor = await Vendor.findById(vendorId).select(
      'name businessName businessDetails shopPhotos offers marketingStats isAvailableNow address categories service profilePhoto'
    ).lean();

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Also get primary listing for any synced portfolio photos
    const primaryListing = await ServiceListing.findOne({ vendorId }).lean();
    let syncedPhotos = vendor.shopPhotos || [];

    // If vendor has portfolioPhotos on listing but none in shopPhotos, hydrate shopPhotos
    if (syncedPhotos.length === 0 && primaryListing?.portfolioPhotos?.length > 0) {
      syncedPhotos = primaryListing.portfolioPhotos.map((url, idx) => ({
        _id: `synced_${idx}`,
        url,
        caption: idx === 0 ? 'Store Front' : 'Store Interior',
        category: idx === 0 ? 'Storefront' : 'Interior',
        uploadedAt: new Date()
      }));
    }

    // Default marketing stats if empty
    const approvedOffers = (vendor.offers || []).filter(isApprovedMarketingItem);
    const approvedPhotos = syncedPhotos.filter(isApprovedMarketingItem);

    const stats = {
      storeViews: vendor.marketingStats?.storeViews || 1480,
      offerClicks: vendor.marketingStats?.offerClicks || 215,
      inquiriesCalls: vendor.marketingStats?.inquiriesCalls || 38,
      customerLikes: vendor.marketingStats?.customerLikes || 94,
      activeOffersCount: approvedOffers.filter(o => o.isActive).length,
      pendingOffersCount: (vendor.offers || []).filter(o => o.reviewStatus === 'pending').length,
      pendingPhotosCount: syncedPhotos.filter(p => p.reviewStatus === 'pending').length,
      totalPhotosCount: approvedPhotos.length
    };

    res.status(200).json({
      success: true,
      data: {
        storeName: vendor.businessName || vendor.businessDetails?.businessName || vendor.name,
        category: (vendor.categories && vendor.categories[0]) || (vendor.service && vendor.service[0]) || 'Local Store',
        address: vendor.address?.fullAddress || vendor.address?.city || 'Indore, MP',
        profilePhoto: vendor.profilePhoto || null,
        isStoreLive: vendor.isAvailableNow !== false,
        stats,
        offers: vendor.offers || [],
        shopPhotos: syncedPhotos
      }
    });
  } catch (error) {
    console.error('Error fetching marketing overview:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch marketing data' });
  }
};

/**
 * POST /api/vendors/marketing/offers
 * Create a new promotional offer / deal for the shop
 */
const createOffer = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const {
      title,
      tagline,
      discountBadge,
      discountPercent,
      discountAmount,
      offerType,
      code,
      imageUrl,
      validTill,
      terms
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Offer title is required' });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    let finalImageUrl = imageUrl;
    if (imageUrl && imageUrl.startsWith('data:')) {
      const uploadRes = await cloudinaryService.uploadFile(imageUrl, { folder: 'vendors/offers' });
      if (uploadRes.success) {
        finalImageUrl = uploadRes.url;
      }
    }

    const badge = discountBadge?.trim() || 
      (discountPercent ? `${discountPercent}% OFF` : (discountAmount ? `FLAT ₹${discountAmount} OFF` : 'SPECIAL OFFER'));

    const newOffer = {
      title: title.trim(),
      tagline: tagline ? tagline.trim() : '',
      discountBadge: badge,
      discountPercent: Number(discountPercent) || 0,
      discountAmount: Number(discountAmount) || 0,
      offerType: offerType || 'PERCENTAGE',
      code: code ? code.toUpperCase().trim() : 'APNA20',
      imageUrl: finalImageUrl || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80',
      validTill: validTill ? new Date(validTill) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      terms: terms ? terms.trim() : 'Valid in-store & Apna Market orders. Cannot be combined with other offers.',
      isActive: true,
      viewsCount: 0,
      claimsCount: 0,
      createdAt: new Date(),
      reviewStatus: 'pending',
      reviewedAt: null,
      reviewedBy: null,
      rejectedReason: null
    };

    vendor.offers.unshift(newOffer);
    await vendor.save();
    await syncApprovedMarketingToListing(vendorId, vendor);

    res.status(201).json({
      success: true,
      message: 'Offer submitted successfully. It will go live after admin approval.',
      offer: vendor.offers[0]
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ success: false, message: 'Failed to create offer' });
  }
};

/**
 * PUT /api/vendors/marketing/offers/:id
 * Update an existing offer (or toggle active status)
 */
const updateOffer = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    const offer = vendor.offers.id(id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });

    if (updates.title !== undefined) offer.title = updates.title.trim();
    if (updates.tagline !== undefined) offer.tagline = updates.tagline.trim();
    if (updates.discountBadge !== undefined) offer.discountBadge = updates.discountBadge;
    if (updates.discountPercent !== undefined) offer.discountPercent = Number(updates.discountPercent);
    if (updates.discountAmount !== undefined) offer.discountAmount = Number(updates.discountAmount);
    if (updates.code !== undefined) offer.code = updates.code.toUpperCase().trim();
    if (updates.terms !== undefined) offer.terms = updates.terms;
    if (updates.validTill !== undefined) offer.validTill = new Date(updates.validTill);
    if (updates.isActive !== undefined) offer.isActive = Boolean(updates.isActive);

    if (updates.imageUrl) {
      if (updates.imageUrl.startsWith('data:')) {
        const uploadRes = await cloudinaryService.uploadFile(updates.imageUrl, { folder: 'vendors/offers' });
        if (uploadRes.success) offer.imageUrl = uploadRes.url;
      } else {
        offer.imageUrl = updates.imageUrl;
      }
    }

    offer.reviewStatus = 'pending';
    offer.reviewedAt = null;
    offer.reviewedBy = null;
    offer.rejectedReason = null;

    await vendor.save();
    await syncApprovedMarketingToListing(vendorId, vendor);

    res.status(200).json({
      success: true,
      message: 'Offer update submitted for admin approval',
      offer
    });
  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({ success: false, message: 'Failed to update offer' });
  }
};

/**
 * DELETE /api/vendors/marketing/offers/:id
 * Delete an offer
 */
const deleteOffer = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    vendor.offers = vendor.offers.filter(o => o._id.toString() !== id);
    await vendor.save();
    await syncApprovedMarketingToListing(vendorId, vendor);

    res.status(200).json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({ success: false, message: 'Failed to delete offer' });
  }
};

/**
 * POST /api/vendors/marketing/photos
 * Upload shop photo (Storefront, Interior, Counter, Menu, etc.)
 */
const uploadShopPhoto = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { url, caption, category } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, message: 'Photo image is required' });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    let finalUrl = url;
    if (url.startsWith('data:')) {
      const uploadRes = await cloudinaryService.uploadFile(url, { folder: 'vendors/shop-photos' });
      if (uploadRes.success) {
        finalUrl = uploadRes.url;
      }
    }

    const newPhoto = {
      url: finalUrl,
      caption: caption ? caption.trim() : 'Shop Showcase',
      category: category || 'Storefront',
      uploadedAt: new Date(),
      reviewStatus: 'pending',
      reviewedAt: null,
      reviewedBy: null,
      rejectedReason: null
    };

    vendor.shopPhotos.unshift(newPhoto);
    await vendor.save();
    await syncApprovedMarketingToListing(vendorId, vendor);

    res.status(201).json({
      success: true,
      message: 'Shop photo submitted successfully. It will go live after admin approval.',
      photo: vendor.shopPhotos[0]
    });
  } catch (error) {
    console.error('Error uploading shop photo:', error);
    res.status(500).json({ success: false, message: 'Failed to upload photo' });
  }
};

/**
 * DELETE /api/vendors/marketing/photos/:id
 * Delete a shop photo
 */
const deleteShopPhoto = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    const photoToDelete = vendor.shopPhotos.id(id);
    const photoUrl = photoToDelete ? photoToDelete.url : null;

    vendor.shopPhotos = vendor.shopPhotos.filter(p => p._id.toString() !== id);
    await vendor.save();
    await syncApprovedMarketingToListing(vendorId, vendor);

    res.status(200).json({ success: true, message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting shop photo:', error);
    res.status(500).json({ success: false, message: 'Failed to delete photo' });
  }
};

/**
 * PATCH /api/vendors/marketing/visibility
 * Toggle store online / open live visibility
 */
const toggleStoreVisibility = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { isStoreLive } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    vendor.isAvailableNow = isStoreLive !== undefined ? Boolean(isStoreLive) : !vendor.isAvailableNow;
    await vendor.save();

    res.status(200).json({
      success: true,
      message: vendor.isAvailableNow ? 'Store is now LIVE on Apna Market' : 'Store is paused',
      isStoreLive: vendor.isAvailableNow
    });
  } catch (error) {
    console.error('Error toggling store visibility:', error);
    res.status(500).json({ success: false, message: 'Failed to update visibility' });
  }
};

module.exports = {
  getMarketingOverview,
  createOffer,
  updateOffer,
  deleteOffer,
  uploadShopPhoto,
  deleteShopPhoto,
  toggleStoreVisibility,
  syncApprovedMarketingToListing,
  isApprovedMarketingItem
};
