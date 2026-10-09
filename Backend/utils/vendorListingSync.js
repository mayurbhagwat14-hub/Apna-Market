const Vendor = require('../models/Vendor');
const ServiceListing = require('../models/ServiceListing');
const Category = require('../models/Category');

/**
 * Ensures all approved vendors have corresponding active ServiceListings
 * for their selected categories so they appear in customer search & discovery.
 */
const syncApprovedVendorListings = async () => {
  try {
    const approvedVendors = await Vendor.find({
      approvalStatus: 'approved',
      accountStatus: { $nin: ['SUSPENDED', 'BLOCKED'] }
    });

    const categories = await Category.find({});
    if (!categories.length) return;

    const defaultShopsCat = categories.find(c => c.slug === 'shops' || c.title.toLowerCase() === 'shops') || categories[0];

    for (const vendor of approvedVendors) {
      // Collect all categories vendor signed up for
      const catList = [
        ...(Array.isArray(vendor.service) ? vendor.service : [vendor.service].filter(Boolean)),
        ...(Array.isArray(vendor.categories) ? vendor.categories : []),
        ...Object.keys(vendor.serviceDetails || {})
      ].filter(Boolean);

      const uniqueCatNames = Array.from(new Set(catList));
      const targetCategories = [];

      for (const catName of uniqueCatNames) {
        const found = categories.find(c =>
          c.title.toLowerCase() === catName.toLowerCase() ||
          c.slug.toLowerCase() === catName.toLowerCase()
        );
        if (found && !targetCategories.some(t => t._id.equals(found._id))) {
          targetCategories.push(found);
        }
      }

      if (targetCategories.length === 0 && defaultShopsCat) {
        targetCategories.push(defaultShopsCat);
      }

      // If businessName is empty, give it a clean fallback
      if (!vendor.businessName) {
        const fallbackName = vendor.businessDetails?.businessName ||
          vendor.serviceDetails?.Shops?.shopName ||
          vendor.name ||
          'Local Business';
        await Vendor.updateOne({ _id: vendor._id }, { $set: { businessName: fallbackName } });
        vendor.businessName = fallbackName;
      }

      for (const cat of targetCategories) {
        const existing = await ServiceListing.findOne({ vendorId: vendor._id, categoryId: cat._id });
        if (!existing) {
          const sDetails = vendor.serviceDetails?.[cat.title] || vendor.serviceDetails?.[cat.slug] || {};
          const shopName = sDetails.shopName || sDetails.boutiqueName || vendor.businessName || vendor.name;
          const fallbackCover = cat.homeIconUrl || cat.imageUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80';

          await ServiceListing.create({
            vendorId: vendor._id,
            categoryId: cat._id,
            categoryName: cat.title,
            title: shopName,
            description: sDetails.storeType
              ? `${sDetails.storeType} in ${vendor.address?.city || 'Indore'}`
              : (vendor.businessDetails?.businessDescription || `${cat.title} Store & Local Business`),
            shortDescription: sDetails.storeType || `${cat.title} Store`,
            status: 'APPROVED',
            serviceArea: {
              city: vendor.address?.city || 'Indore',
              radiusKm: sDetails.deliveryRadiusKm ? Number(sDetails.deliveryRadiusKm) : 15
            },
            pricing: {
              basePrice: sDetails.basePrice ? Number(sDetails.basePrice) : 99
            },
            portfolioPhotos: (vendor.shopPhotos && vendor.shopPhotos.length > 0)
              ? vendor.shopPhotos.map(p => p.url).filter(Boolean)
              : [fallbackCover],
            dynamicFormAnswers: {
              shopName: shopName,
              vendorName: vendor.name,
              rating: vendor.rating || 4.8,
              reviewCount: vendor.totalReviews || 28,
              lat: vendor.address?.lat ?? null,
              lng: vendor.address?.lng ?? null,
              city: vendor.address?.city || 'Indore',
              address: vendor.address?.fullAddress || vendor.address?.addressLine1 || '',
              openStatus: sDetails.operatingHours ? `Open Now • ${sDetails.operatingHours}` : 'Open Now • 8:00 AM - 10:00 PM',
              deliveryInfo: sDetails.deliveryAvailable ? 'Delivery Available' : 'Store Pickup & Local Delivery',
              coverImage: fallbackCover,
              tags: [cat.title, sDetails.storeType || 'Store', 'Local Business']
            }
          });
        }
      }
    }
  } catch (err) {
    console.error('Error syncing approved vendor listings:', err);
  }
};

module.exports = { syncApprovedVendorListings };
