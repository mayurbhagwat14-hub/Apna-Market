const Category = require('../../models/Category');
const Brand = require('../../models/Brand');
const Service = require('../../models/UserService');
const HomeContent = require('../../models/HomeContent');

/**
 * Public Catalog Controllers
 * These endpoints are accessible without authentication for user app
 */

/**
 * Get all active categories for user app
 * GET /api/public/categories
 */
const getPublicCategories = async (req, res) => {
  try {
    const { cityId } = req.query;

    // Build query - return active categories (both city-specific and global)
    const query = { status: 'active' };
    if (cityId) {
      query.$or = [
        { cityIds: cityId },
        { cityIds: { $size: 0 } },
        { cityIds: { $exists: false } }
      ];
    }

    const categories = await Category.find(query)
      .select('title subtitle slug homeIconUrl imageUrl icon homeBadge hasSaleBadge homeOrder showOnHome supportedBookingTypes bookingMode defaultPricingModel allowMultiSelect formSchema vendorFormSchema serviceFulfillmentType trackingType')
      .sort({ homeOrder: 1, createdAt: -1 })
      .lean();

    // Fetch necessary fields for category list
    const initialCategories = categories.map(cat => ({
      id: cat._id.toString(),
      title: cat.title,
      subtitle: cat.subtitle || '',
      slug: cat.slug,
      icon: cat.homeIconUrl || cat.imageUrl || cat.icon || '',
      imageUrl: cat.imageUrl || cat.homeIconUrl || cat.icon || '',
      homeIconUrl: cat.homeIconUrl || cat.imageUrl || cat.icon || '',
      badge: cat.homeBadge || '',
      hasSaleBadge: cat.hasSaleBadge || false,
      showOnHome: cat.showOnHome !== false,
      supportedBookingTypes: cat.supportedBookingTypes || ['scheduled'],
      bookingMode: cat.bookingMode || 'BOTH',
      serviceFulfillmentType: cat.serviceFulfillmentType || 'ON_SITE',
      trackingType: cat.trackingType || 'live',
      defaultPricingModel: cat.defaultPricingModel || 'FIXED',
      allowMultiSelect: Boolean(cat.allowMultiSelect),
      formSchema: cat.formSchema || [],
      vendorFormSchema: cat.vendorFormSchema || []
    }));

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');

    res.status(200).json({
      success: true,
      categories: initialCategories
    });
  } catch (error) {
    console.error('Get public categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories. Please try again.'
    });
  }
};

/**
 * Get all active brands for user app (Formerly Services)
 * GET /api/public/brands
 */
const getPublicBrands = async (req, res) => {
  try {
    const { categoryId, categorySlug, search, cityId } = req.query;

    // Build query
    const query = { status: 'active' };
    if (categoryId) query.categoryIds = categoryId;
    if (cityId) query.cityIds = cityId;

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.title = { $regex: escapedSearch, $options: 'i' };
    }

    let brands = await Brand.find(query)
      .select('title slug iconUrl logo imageUrl badge categoryIds basePrice discountPrice sections')
      .sort({ createdAt: -1 })
      .lean();

    // If categorySlug is provided, filter by category
    if (categorySlug) {
      const catQuery = { slug: categorySlug, status: 'active' };
      if (cityId) {
        catQuery.cityIds = cityId;
      }

      let category = await Category.findOne(catQuery).lean();

      if (!category && cityId) {
        category = await Category.findOne({ slug: categorySlug, status: 'active' }).lean();
      }

      if (category) {
        brands = brands.filter(b =>
          Array.isArray(b.categoryIds) &&
          b.categoryIds.some(id => id.toString() === category._id.toString())
        );
      }
    }

    res.status(200).json({
      success: true,
      brands: brands.map(brand => ({
        id: brand._id.toString(),
        title: brand.title,
        slug: brand.slug,
        icon: brand.iconUrl || '',
        logo: brand.logo || brand.iconUrl || '',
        imageUrl: brand.imageUrl || brand.iconUrl || '',
        badge: brand.badge || '',
        price: brand.basePrice || 0, // Legacy support
        originalPrice: brand.discountPrice ? (brand.basePrice + brand.discountPrice) : (brand.basePrice || 0),
        categoryId: brand.categoryIds && brand.categoryIds.length > 0 ? brand.categoryIds[0].toString() : null,
        categoryIds: (brand.categoryIds || []).map(id => id.toString()),
        sections: brand.sections || []
      }))
    });
  } catch (error) {
    console.error('Get public brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brands. Please try again.'
    });
  }
};

/**
 * Get brand by slug for user app
 * GET /api/public/brands/slug/:slug
 */
const getPublicBrandBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const brand = await Brand.findOne({ slug, status: 'active' })
      .populate('categoryIds', 'title slug')
      .lean();

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    // Remove _id from nested objects
    const cleanBrand = JSON.parse(JSON.stringify(brand));
    const removeIds = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(item => {
          if (item && typeof item === 'object') {
            const { _id, ...rest } = item;
            return removeIds(rest);
          }
          return item;
        });
      } else if (obj && typeof obj === 'object') {
        const { _id, ...rest } = obj;
        return Object.keys(rest).reduce((acc, key) => {
          acc[key] = removeIds(rest[key]);
          return acc;
        }, {});
      }
      return obj;
    };

    // Fetch services associated with this brand
    const brandServices = await Service.find({ brandId: brand._id, status: 'active' }).lean();

    // Map services to a default section structure for the frontend
    const servicesSection = {
      title: brand.title,
      subtitle: 'Available Services',
      cards: brandServices.map(svc => ({
        id: svc._id.toString(),
        title: svc.title,
        subtitle: svc.description || '',
        price: svc.basePrice,
        rating: "4.8", // Default rating
        reviews: "1k+", // Default reviews
        imageUrl: svc.iconUrl || brand.iconUrl || '',
        features: svc.description ? [svc.description] : [],
        duration: "60 min" // Default duration
      }))
    };

    const formattedBrand = {
      id: brand._id.toString(),
      title: brand.title,
      slug: brand.slug,
      icon: brand.iconUrl || '',
      logo: brand.logo || '',
      badge: brand.badge || '',
      basePrice: brand.basePrice, // Legacy
      category: brand.categoryIds && brand.categoryIds[0] ? {
        id: brand.categoryIds[0]._id.toString(),
        title: brand.categoryIds[0].title,
        slug: brand.categoryIds[0].slug
      } : null,
      categories: (brand.categoryIds || []).map(cat => ({
        id: cat._id.toString(),
        title: cat.title,
        slug: cat.slug
      })),
      page: brand.page ? removeIds(brand.page) : {
        banners: brand.iconUrl ? [{ imageUrl: brand.iconUrl, text: brand.title }] : [],
        paymentOffers: [],
        paymentOffersEnabled: false
      },
      sections: brandServices.length > 0 ? [servicesSection] : []
    };

    res.status(200).json({
      success: true,
      brand: formattedBrand
    });
  } catch (error) {
    console.error('Get public brand by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brand. Please try again.'
    });
  }
};

/**
 * Get services based on brand
 * GET /api/public/services
 */
const getPublicServices = async (req, res) => {
  try {
    const { brandId, brandSlug, categoryId } = req.query;

    const query = { status: 'active' };

    if (brandId) {
      query.brandId = brandId;
    } else if (brandSlug) {
      const brand = await Brand.findOne({ slug: brandSlug });
      if (brand) {
        query.brandId = brand._id;
      } else {
        return res.status(200).json({ success: true, services: [] });
      }
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (req.query.search) {
      const escapedSearch = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.title = { $regex: escapedSearch, $options: 'i' };
    }

    const services = await Service.find(query)
      .populate('brandId', 'title iconUrl')
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      services: services.map(svc => ({
        id: svc._id.toString(),
        title: svc.title,
        slug: svc.slug,
        icon: svc.iconUrl,
        basePrice: svc.basePrice,
        gstPercentage: svc.gstPercentage,
        description: svc.description,
        brandId: svc.brandId?._id,
        brandName: svc.brandId?.title,
        brandIcon: svc.brandId?.iconUrl
      }))
    });
  } catch (error) {
    console.error('Get public services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services'
    });
  }
};

/**
 * Get home content
 */
const getPublicHomeContent = async (req, res) => {
  try {
    const { cityId } = req.query;
    const homeContent = await HomeContent.getHomeContent(cityId);

    if (!homeContent) {
      return res.status(200).json({
        success: true,
        homeContent: {
          banners: [],
          promos: [],
          curated: [],
          noteworthy: [],
          booked: [],
          categorySections: []
        }
      });
    }

    // Used for backwards compatibility, we might need to update this to refer to Brands?
    // For now keeping as is, but assuming targetServiceId will point to Brand ID essentially.

    const contentObj = homeContent.toObject();

    const formattedContent = {
      banners: (contentObj.banners || []).map(item => ({
        ...item,
        id: item._id ? item._id.toString() : item.id,
        targetCategoryId: item.targetCategoryId?.toString() || null,
        targetServiceId: item.targetServiceId?.toString() || null,
      })),
      promos: (contentObj.promos || []).map(item => ({
        ...item,
        id: item._id ? item._id.toString() : item.id,
        targetCategoryId: item.targetCategoryId?.toString() || null,
        targetServiceId: item.targetServiceId?.toString() || null,
      })),
      curated: (contentObj.curated || []).map(item => ({
        ...item,
        id: item._id ? item._id.toString() : item.id,
        targetCategoryId: item.targetCategoryId?.toString() || null,
        targetServiceId: item.targetServiceId?.toString() || null,
      })),
      noteworthy: (contentObj.noteworthy || []).map(item => ({
        ...item,
        id: item._id ? item._id.toString() : item.id,
        targetCategoryId: item.targetCategoryId?.toString() || null,
        targetServiceId: item.targetServiceId?.toString() || null,
      })),
      booked: (contentObj.booked || []).map(item => ({
        ...item,
        id: item._id ? item._id.toString() : item.id,
        targetCategoryId: item.targetCategoryId?.toString() || null,
        targetServiceId: item.targetServiceId?.toString() || null,
      })),
      categorySections: (contentObj.categorySections || []).map(section => ({
        ...section,
        id: section._id ? section._id.toString() : section.id,
        seeAllTargetCategoryId: section.seeAllTargetCategoryId?.toString() || null,
        seeAllTargetServiceId: section.seeAllTargetServiceId?.toString() || null,
        cards: (section.cards || []).map(card => ({
          ...card,
          id: card._id ? card._id.toString() : card.id,
          targetCategoryId: card.targetCategoryId?.toString() || null,
          targetServiceId: card.targetServiceId?.toString() || null,
        }))
      })),
      isBannersVisible: contentObj.isBannersVisible ?? true,
      isPromosVisible: contentObj.isPromosVisible ?? true,
      isCuratedVisible: contentObj.isCuratedVisible ?? true,
      isNoteworthyVisible: contentObj.isNoteworthyVisible ?? true,
      isBookedVisible: contentObj.isBookedVisible ?? true,
      isCategorySectionsVisible: contentObj.isCategorySectionsVisible ?? true,
      isCategoriesVisible: contentObj.isCategoriesVisible ?? true
    };

    res.status(200).json({
      success: true,
      homeContent: formattedContent
    });

  } catch (error) {
    console.error('Get public home content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home content. Please try again.'
    });
  }
};

/**
 * Get consolidated home data (Categories + Content)
 */
const getPublicHomeData = async (req, res) => {
  try {
    const { cityId } = req.query;

    const categoryQuery = { status: 'active' };
    if (cityId) {
      categoryQuery.$or = [
        { cityIds: cityId },
        { cityIds: { $size: 0 } },
        { cityIds: { $exists: false } }
      ];
    }

    // Fetch both in parallel
    const [categoriesRes, homeContent] = await Promise.all([
      Category.find(categoryQuery)
        .select('title slug homeIconUrl imageUrl homeBadge hasSaleBadge supportedBookingTypes bookingMode defaultPricingModel allowMultiSelect formSchema vendorFormSchema serviceFulfillmentType trackingType')
        .sort({ homeOrder: 1 })
        .lean(),
      HomeContent.getHomeContent(cityId)
    ]);

    const formattedCategories = categoriesRes.map(cat => ({
      id: cat._id.toString(),
      title: cat.title,
      slug: cat.slug,
      icon: cat.homeIconUrl || cat.imageUrl || '',
      badge: cat.homeBadge || '',
      hasSaleBadge: cat.hasSaleBadge || false,
      supportedBookingTypes: cat.supportedBookingTypes || ['scheduled'],
      bookingMode: cat.bookingMode || 'BOTH',
      serviceFulfillmentType: cat.serviceFulfillmentType || 'ON_SITE',
      trackingType: cat.trackingType || 'live',
      defaultPricingModel: cat.defaultPricingModel || 'FIXED',
      allowMultiSelect: Boolean(cat.allowMultiSelect),
      formSchema: cat.formSchema || [],
      vendorFormSchema: cat.vendorFormSchema || []
    }));

    let formattedContent = null;
    if (homeContent) {
      const contentObj = homeContent.toObject();
      formattedContent = {
        banners: (contentObj.banners || []).map(item => ({
          ...item,
          id: item._id ? item._id.toString() : item.id,
          targetCategoryId: item.targetCategoryId?.toString() || null,
          targetServiceId: item.targetServiceId?.toString() || null,
          imageUrl: item.imageUrl,
          slug: item.slug,
          order: item.order
        })),
        promos: (contentObj.promos || []).map(item => ({
          title: item.title,
          subtitle: item.subtitle,
          imageUrl: item.imageUrl,
          targetCategoryId: item.targetCategoryId?.toString() || null,
          order: item.order
        })),
        curated: (contentObj.curated || []).map(item => ({
          title: item.title,
          gifUrl: item.gifUrl,
          order: item.order
        })),
        noteworthy: (contentObj.noteworthy || []).map(item => ({
          title: item.title,
          imageUrl: item.imageUrl,
          targetCategoryId: item.targetCategoryId?.toString() || null,
          order: item.order
        })),
        booked: (contentObj.booked || []).map(item => ({
          title: item.title,
          rating: item.rating,
          price: item.price,
          imageUrl: item.imageUrl,
          targetCategoryId: item.targetCategoryId?.toString() || null,
          order: item.order
        })),
        categorySections: (contentObj.categorySections || []).map(section => ({
          title: section.title,
          seeAllTargetCategoryId: section.seeAllTargetCategoryId?.toString() || null,
          cards: (section.cards || []).map(card => ({
            title: card.title,
            imageUrl: card.imageUrl,
            price: card.price,
            rating: card.rating,
            targetCategoryId: card.targetCategoryId?.toString() || null
          })),
          order: section.order
        })),
        isBannersVisible: contentObj.isBannersVisible ?? true,
        isPromosVisible: contentObj.isPromosVisible ?? true,
        isCuratedVisible: contentObj.isCuratedVisible ?? true,
        isNoteworthyVisible: contentObj.isNoteworthyVisible ?? true,
        isBookedVisible: contentObj.isBookedVisible ?? true,
        isCategorySectionsVisible: contentObj.isCategorySectionsVisible ?? true,
        isCategoriesVisible: contentObj.isCategoriesVisible ?? true
      };
    }

    res.status(200).json({
      success: true,
      categories: formattedCategories,
      homeContent: formattedContent
    });
  } catch (error) {
    console.error('Get public home data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home data'
    });
  }
};

/**
 * Get approved provider service listings for Customer App
 * GET /api/public/provider-services
 */
const getPublicServiceListings = async (req, res) => {
  try {
    const { categoryId, categorySlug, city, search, lat, lng, radiusKm, page = 1, limit = 20 } = req.query;
    const ServiceListing = require('../../models/ServiceListing');
    const Vendor = require('../../models/Vendor');
    const { LIVE_PUBLIC_QUERY, toPublicListingDto } = require('../../utils/serviceListingPublic');

    const andClauses = [LIVE_PUBLIC_QUERY];

    const { syncApprovedVendorListings } = require('../../utils/vendorListingSync');
    // Ensure newly approved vendors have active listings
    try {
      await syncApprovedVendorListings();
    } catch (syncErr) {
      console.warn('Vendor listing sync notice:', syncErr?.message);
    }

    if (categoryId) {
      const Category = require('../../models/Category');
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(categoryId)) {
        andClauses.push({ categoryId });
      } else {
        const cat = await Category.findOne({
          $or: [
            { slug: categoryId.toLowerCase() },
            { title: { $regex: new RegExp(`^${categoryId}$`, 'i') } }
          ]
        });
        if (cat) {
          andClauses.push({ categoryId: cat._id });
        } else {
          andClauses.push({ categoryId: null });
        }
      }
    }
    if (categorySlug && categorySlug !== 'all') {
      const Category = require('../../models/Category');
      const cat = await Category.findOne({
        $or: [
          { slug: categorySlug.toLowerCase() },
          { title: { $regex: new RegExp(`^${categorySlug}$`, 'i') } }
        ]
      });
      if (cat) andClauses.push({ categoryId: cat._id });
    }
    if (city) {
      const cityClean = city.trim();
      const cityVendors = await Vendor.find({
        approvalStatus: 'approved',
        accountStatus: { $nin: ['SUSPENDED', 'BLOCKED'] },
        'address.city': { $regex: cityClean, $options: 'i' }
      }).select('_id').lean();
      const cityVendorIds = cityVendors.map((v) => v._id);

      andClauses.push({
        $or: [
          { 'serviceArea.city': { $regex: cityClean, $options: 'i' } },
          { 'serviceArea.areas': { $regex: cityClean, $options: 'i' } },
          { vendorId: { $in: cityVendorIds } }
        ]
      });
    }
    if (search && search.trim()) {
      const trimmed = search.trim();
      const escaped = trimmed.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');

      const Category = require('../../models/Category');
      const [matchedVendors, matchedCats] = await Promise.all([
        Vendor.find({
          approvalStatus: 'approved',
          accountStatus: { $nin: ['SUSPENDED', 'BLOCKED'] },
          $or: [
            { name: { $regex: searchRegex } },
            { businessName: { $regex: searchRegex } },
            { 'businessDetails.businessName': { $regex: searchRegex } },
            { 'serviceDetails.Shops.shopName': { $regex: searchRegex } }
          ]
        }).select('_id').lean(),
        Category.find({
          $or: [
            { title: { $regex: searchRegex } },
            { slug: { $regex: searchRegex } }
          ]
        }).select('_id').lean()
      ]);

      const matchedVendorIds = matchedVendors.map((v) => v._id);
      const matchedCatIds = matchedCats.map((c) => c._id);

      const searchOr = [
        { title: { $regex: searchRegex } },
        { categoryName: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { shortDescription: { $regex: searchRegex } },
        { 'dynamicFormAnswers.shopName': { $regex: searchRegex } },
        { 'dynamicFormAnswers.vendorName': { $regex: searchRegex } },
        { 'catalogItems.name': { $regex: searchRegex } }
      ];

      if (matchedVendorIds.length > 0) {
        searchOr.push({ vendorId: { $in: matchedVendorIds } });
      }
      if (matchedCatIds.length > 0) {
        searchOr.push({ categoryId: { $in: matchedCatIds } });
      }

      andClauses.push({ $or: searchOr });
    }

    const activeVendors = await Vendor.find({
      approvalStatus: 'approved',
      accountStatus: { $nin: ['SUSPENDED', 'BLOCKED'] }
    }).select('_id').lean();
    andClauses.push({ vendorId: { $in: activeVendors.map((v) => v._id) } });

    const query = { $and: andClauses };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [listings, total] = await Promise.all([
      ServiceListing.find(query)
        .populate('vendorId', 'name businessName profilePhoto rating totalReviews completedJobs address approvalStatus accountStatus shopPhotos offers')
        .populate('categoryId', 'title slug homeIconUrl bookingMode paymentConfig serviceFulfillmentType trackingType defaultPricingModel vendorFormSchema catalogItemSchema pricingFormSchema availabilityFormSchema serviceAreaFormSchema bookingRulesFormSchema documentsFormSchema')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ServiceListing.countDocuments(query)
    ]);

    let validListings = listings.map(toPublicListingDto).filter(Boolean);

    // If querying all categories (no specific category selected), deduplicate by physical vendor/store
    if (!categoryId && (!categorySlug || categorySlug === 'all')) {
      const uniqueMap = new Map();
      for (const item of validListings) {
        const vId = item.vendorId?._id || item.vendorId || item.provider?._id || item.provider?.id;
        const rawName = (item.businessName || item.title || item.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const key = vId ? `v-${vId}` : (rawName ? `n-${rawName}` : String(item._id || item.id));

        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item);
        } else {
          const existing = uniqueMap.get(key);
          const existingCat = (existing.categorySlug || existing.categoryName || '').toLowerCase();
          const newCat = (item.categorySlug || item.categoryName || '').toLowerCase();
          const existingIsGeneric = existingCat === 'shops' || existingCat === 'all-stores';
          const newIsSpecific = newCat && newCat !== 'shops' && newCat !== 'all-stores';

          const existingReviews = Number(existing.reviewsCount || existing.provider?.reviews || 0);
          const newReviews = Number(item.reviewsCount || item.provider?.reviews || 0);

          if (existingIsGeneric && newIsSpecific) {
            uniqueMap.set(key, item);
          } else if (newReviews > existingReviews) {
            uniqueMap.set(key, item);
          }
        }
      }
      validListings = Array.from(uniqueMap.values());
    }

    const userLat = (lat !== undefined && lat !== null && lat !== '') ? Number(lat) : null;
    const userLng = (lng !== undefined && lng !== null && lng !== '') ? Number(lng) : null;

    if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
      validListings.forEach((item) => {
        const itemLat = item.lat ?? item.latitude ?? item.provider?.lat ?? null;
        const itemLng = item.lng ?? item.longitude ?? item.provider?.lng ?? null;
        if (itemLat !== null && itemLng !== null && !isNaN(itemLat) && !isNaN(itemLng)) {
          const R = 6371; // Earth radius in km
          const dLat = (itemLat - userLat) * Math.PI / 180;
          const dLon = (itemLng - userLng) * Math.PI / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(itemLat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distKm = Math.round(R * c * 10) / 10;
          item.distanceKm = distKm;
          item.distance = distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`;
        } else {
          item.distanceKm = 9999;
          item.distance = 'Nearby';
        }
      });

      // Filter by radius if provided
      let sortedListings = validListings;
      if (radiusKm && !isNaN(Number(radiusKm))) {
        const maxR = Number(radiusKm);
        sortedListings = sortedListings.filter((item) => (item.distanceKm || 0) <= maxR);
      }

      // Sort by distance (closest first!)
      sortedListings.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
      validListings = sortedListings;
    } else {
      validListings.sort((a, b) => {
        const ratingA = Number(a.provider?.rating) || 0;
        const ratingB = Number(b.provider?.rating) || 0;
        const reviewsA = Number(a.provider?.reviews) || 0;
        const reviewsB = Number(b.provider?.reviews) || 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return reviewsB - reviewsA;
      });
    }

    res.status(200).json({
      success: true,
      listings: validListings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get public service listings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch provider services' });
  }
};

/**
 * Get a single live provider listing (approved snapshot if an edit is under review)
 * GET /api/public/provider-services/:id
 */
const getPublicServiceListingById = async (req, res) => {
  try {
    const ServiceListing = require('../../models/ServiceListing');
    const { isListingBookable, toPublicListingDto } = require('../../utils/serviceListingPublic');

    const listing = await ServiceListing.findById(req.params.id)
      .populate('vendorId', 'name businessName profilePhoto rating totalReviews completedJobs address approvalStatus accountStatus shopPhotos offers')
      .populate('categoryId', 'title slug homeIconUrl bookingMode paymentConfig serviceFulfillmentType trackingType defaultPricingModel vendorFormSchema catalogItemSchema')
      .lean();

    if (!listing || !isListingBookable(listing)) {
      return res.status(404).json({ success: false, message: 'Service listing not found' });
    }

    const dto = toPublicListingDto(listing);
    if (!dto) {
      return res.status(404).json({ success: false, message: 'Service listing not found' });
    }

    res.status(200).json({
      success: true,
      listing: dto,
      vendorFormSchema: listing.categoryId?.vendorFormSchema || [],
      catalogItemSchema: listing.categoryId?.catalogItemSchema || []
    });
  } catch (error) {
    console.error('Get public service listing detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch provider service' });
  }
};

/**
 * Customer vendor shop — all live listing blocks + packages for one provider
 * GET /api/public/providers/:vendorId
 */
const getPublicProviderProfile = async (req, res) => {
  try {
    const Vendor = require('../../models/Vendor');
    const ServiceListing = require('../../models/ServiceListing');
    const { isListingBookable, toPublicListingDto } = require('../../utils/serviceListingPublic');
    const { vendorId } = req.params;
    const { categoryId } = req.query;

    const vendor = await Vendor.findById(vendorId)
      .select('name profilePhoto rating totalReviews completedJobs address approvalStatus accountStatus businessName')
      .lean();

    if (!vendor || vendor.approvalStatus !== 'approved' || ['SUSPENDED', 'BLOCKED'].includes(vendor.accountStatus)) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    const query = { vendorId: vendor._id };
    if (categoryId) query.categoryId = categoryId;

    const listings = await ServiceListing.find(query)
      .populate('vendorId', 'name profilePhoto rating totalReviews completedJobs address approvalStatus accountStatus businessName')
      .populate('categoryId', 'title slug homeIconUrl bookingMode paymentConfig serviceFulfillmentType trackingType defaultPricingModel vendorFormSchema catalogItemSchema')
      .sort({ updatedAt: -1 })
      .lean();

    const blocks = listings
      .filter(isListingBookable)
      .map(toPublicListingDto)
      .filter(Boolean);

    res.status(200).json({
      success: true,
      provider: {
        id: vendor._id.toString(),
        name: vendor.name,
        businessName: vendor.businessName || '',
        photo: vendor.profilePhoto,
        rating: vendor.rating || 0,
        reviews: vendor.totalReviews || 0,
        completedJobs: vendor.completedJobs || 0,
        city: vendor.address?.city || ''
      },
      listings: blocks,
      totalBlocks: blocks.length,
      totalPackages: blocks.reduce((sum, b) => sum + (b.catalogItems?.length || 0), 0)
    });
  } catch (error) {
    console.error('Get public provider profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch provider profile' });
  }
};

module.exports = {
  getPublicCategories,
  getPublicBrands,
  getPublicBrandBySlug,
  getPublicServices,
  getPublicHomeContent,
  getPublicHomeData,
  getPublicServiceListings,
  getPublicServiceListingById,
  getPublicProviderProfile
};
