const Category = require('../../models/Category');
const Settings = require('../../models/Settings');
const { validationResult } = require('express-validator');
const { SERVICE_STATUS } = require('../../utils/constants');

/**
 * Get all categories
 * GET /api/admin/categories
 */
const getAllCategories = async (req, res) => {
  try {
    const { status, showOnHome, isPopular, cityId } = req.query;

    // Build query - exclude DELETED by default unless status is specified
    const query = {};
    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: SERVICE_STATUS.DELETED };
    }
    if (showOnHome !== undefined) query.showOnHome = showOnHome === 'true';
    if (isPopular !== undefined) query.isPopular = isPopular === 'true';
    if (cityId) query.cityIds = cityId;

    const categories = await Category.find(query)
      .select('-__v')
      .sort({ homeOrder: 1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: categories.length,
      categories: categories.map(cat => ({
        id: cat._id,
        title: cat.title,
        slug: cat.slug,
        homeIconUrl: cat.homeIconUrl,
        homeBadge: cat.homeBadge,
        hasSaleBadge: cat.hasSaleBadge,
        showOnHome: cat.showOnHome,
        homeOrder: cat.homeOrder,
        description: cat.description,
        imageUrl: cat.imageUrl,
        status: cat.status,
        isPopular: cat.isPopular,
        cityIds: cat.cityIds || [],
        supportedBookingTypes: cat.supportedBookingTypes || ['scheduled'],
        bookingMode: cat.bookingMode || 'BOTH',
        serviceFulfillmentType: cat.serviceFulfillmentType || 'ON_SITE',
        trackingType: cat.trackingType || 'live',
        allowVendorBilling: cat.allowVendorBilling !== false,
        defaultPricingModel: cat.defaultPricingModel || 'FIXED',
        allowMultiSelect: Boolean(cat.allowMultiSelect),
        formSchema: cat.formSchema || [],
        vendorFormSchema: cat.vendorFormSchema || [],
        catalogItemSchema: cat.catalogItemSchema || [],
        listingForms: cat.listingForms || [],
        pricingLimits: cat.pricingLimits || { minPrice: 0, maxPrice: 999999 },
        paymentConfig: cat.paymentConfig || { requireAdvancePayment: false, advancePaymentPercent: 0 },
        metaTitle: cat.metaTitle,
        metaDescription: cat.metaDescription,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories. Please try again.'
    });
  }
};

/**
 * Get single category by ID
 * GET /api/admin/categories/:id
 */
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id).select('-__v').lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      category: {
        id: category._id,
        title: category.title,
        slug: category.slug,
        homeIconUrl: category.homeIconUrl,
        homeBadge: category.homeBadge,
        hasSaleBadge: category.hasSaleBadge,
        showOnHome: category.showOnHome,
        homeOrder: category.homeOrder,
        description: category.description,
        imageUrl: category.imageUrl,
        status: category.status,
        isPopular: category.isPopular,
        supportedBookingTypes: category.supportedBookingTypes || ['scheduled'],
        allowMultiSelect: Boolean(category.allowMultiSelect),
        formSchema: category.formSchema || [],
        vendorFormSchema: category.vendorFormSchema || [],
        catalogItemSchema: category.catalogItemSchema || [],
        pricingLimits: category.pricingLimits || { minPrice: 0, maxPrice: 999999 },
        paymentConfig: category.paymentConfig || { requireAdvancePayment: false, advancePaymentPercent: 0 },
        bookingMode: category.bookingMode || 'BOTH',
        serviceFulfillmentType: category.serviceFulfillmentType || 'ON_SITE',
        trackingType: category.trackingType || 'live',
        allowVendorBilling: category.allowVendorBilling !== false,
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    });
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category. Please try again.'
    });
  }
};

/**
 * Create new category
 * POST /api/admin/categories
 */
const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Category Create Validation Errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      slug,
      homeIconUrl,
      homeBadge,
      hasSaleBadge,
      showOnHome,
      homeOrder,
      description,
      imageUrl,
      status,
      isPopular,
      pricingLimits,
      paymentConfig,
      bookingMode,
      serviceFulfillmentType,
      trackingType,
      allowVendorBilling,
      metaTitle,
      metaDescription,
      cityIds
    } = req.body;

    console.log('Creating category with payload:', req.body);

    // Check for duplicate slug ONLY within the same cities
    // Logic:
    // 1. If cityIds provided, check if any existing category with same slug has overlapping cityIds
    // 2. If no cityIds (global), check if global category with same slug exists

    const slugToCheck = slug?.trim().toLowerCase() || title.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

    // Build query for duplicate check
    const duplicateQuery = {
      $or: [
        { slug: slugToCheck }
      ]
    };

    const existingCategory = await Category.findOne(duplicateQuery);

    let isDuplicate = false;
    if (existingCategory) {
      // If found, check city overlap
      const existingCities = existingCategory.cityIds.map(id => id.toString());
      const newCities = (cityIds || []).map(id => id.toString());

      if (newCities.length === 0) {
        // Trying to create Global. Duplicate if existing is also Global
        if (existingCities.length === 0) isDuplicate = true;
      } else {
        // Trying to create City-specific. Duplicate if ANY overlap
        const hasOverlap = newCities.some(cityId => existingCities.includes(cityId));
        if (hasOverlap) isDuplicate = true;

        // Also duplicate if existing is Global (Global covers all cities)
        if (existingCities.length === 0) isDuplicate = true;
      }
    }

    if (isDuplicate && existingCategory) {
      console.log('Category with this title/slug already exists:', existingCategory.title, existingCategory.slug);
      return res.status(400).json({
        success: false,
        message: 'Category with this title or slug already exists'
      });
    }

    const category = await Category.create({
      title: title.trim(),
      slug: slug?.trim().toLowerCase() || undefined, // Will be auto-generated if not provided
      homeIconUrl: homeIconUrl || null,
      homeBadge: homeBadge?.trim() || null,
      hasSaleBadge: Boolean(hasSaleBadge),
      showOnHome: showOnHome !== false,
      homeOrder: Number(homeOrder) || 0,
      description: description?.trim() || null,
      imageUrl: imageUrl || null,
      status: status || SERVICE_STATUS.ACTIVE,
      isPopular: Boolean(isPopular),
      pricingLimits: {
        minPrice: pricingLimits?.minPrice ? Number(pricingLimits.minPrice) : 0,
        maxPrice: pricingLimits?.maxPrice ? Number(pricingLimits.maxPrice) : 999999
      },
      paymentConfig: {
        requireAdvancePayment: Boolean(paymentConfig?.requireAdvancePayment),
        advancePaymentPercent: Math.min(100, Math.max(0, Number(paymentConfig?.advancePaymentPercent ?? 0)))
      },
      bookingMode: ['INSTANT', 'SCHEDULED', 'BOTH', 'REQUEST_QUOTE'].includes(String(bookingMode || '').toUpperCase())
        ? String(bookingMode).toUpperCase()
        : 'BOTH',
      serviceFulfillmentType: String(serviceFulfillmentType || '').toUpperCase() === 'DELIVERY'
        ? 'DELIVERY'
        : 'ON_SITE',
      trackingType: ['live', 'status_only', 'hybrid'].includes(String(trackingType || '').toLowerCase())
        ? String(trackingType).toLowerCase()
        : 'live',
      allowVendorBilling: allowVendorBilling === undefined ? true : Boolean(allowVendorBilling),
      metaTitle: metaTitle?.trim() || null,
      metaDescription: metaDescription?.trim() || null,
      cityIds: cityIds || [],
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: {
        id: category._id,
        title: category.title,
        slug: category.slug,
        homeIconUrl: category.homeIconUrl,
        homeBadge: category.homeBadge,
        hasSaleBadge: category.hasSaleBadge,
        showOnHome: category.showOnHome,
        homeOrder: category.homeOrder,
        description: category.description,
        imageUrl: category.imageUrl,
        status: category.status,
        isPopular: category.isPopular,
        pricingLimits: category.pricingLimits,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    });
  } catch (error) {
    console.error('Create category error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this title or slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create category. Please try again.'
    });
  }
};

/**
 * Update category
 * PUT /api/admin/categories/:id
 */
const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const {
      title,
      slug,
      homeIconUrl,
      homeBadge,
      hasSaleBadge,
      showOnHome,
      homeOrder,
      description,
      imageUrl,
      status,
      isPopular,
      pricingLimits,
      paymentConfig,
      bookingMode,
      serviceFulfillmentType,
      trackingType,
      allowVendorBilling,
      metaTitle,
      metaDescription,
      cityIds: updateCityIds
    } = req.body;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check for duplicate slug ONLY within the same cities
    if (title || slug || updateCityIds) {
      const slugToCheck = slug?.trim().toLowerCase() || (title ? title.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') : category.slug);

      const duplicateQuery = {
        _id: { $ne: id },
        slug: slugToCheck
      };

      const existingCategory = await Category.findOne(duplicateQuery);

      if (existingCategory) {
        let isDuplicate = false;
        const existingCities = existingCategory.cityIds.map(id => id.toString());
        // For update, if updateCityIds provided use it, else use existing category.cityIds
        const newCities = (updateCityIds ? updateCityIds : category.cityIds).map(id => id.toString());

        if (newCities.length === 0) {
          if (existingCities.length === 0) isDuplicate = true;
        } else {
          const hasOverlap = newCities.some(cityId => existingCities.includes(cityId));
          if (hasOverlap) isDuplicate = true;
          if (existingCities.length === 0) isDuplicate = true;
        }

        if (isDuplicate) {
          return res.status(400).json({
            success: false,
            message: 'Category with this title or slug already exists'
          });
        }
      }
    }

    // Update fields
    if (title !== undefined) category.title = title.trim();
    if (slug !== undefined) category.slug = slug.trim().toLowerCase();
    if (homeIconUrl !== undefined) category.homeIconUrl = homeIconUrl || null;
    if (homeBadge !== undefined) category.homeBadge = homeBadge?.trim() || null;
    if (hasSaleBadge !== undefined) category.hasSaleBadge = Boolean(hasSaleBadge);
    if (showOnHome !== undefined) category.showOnHome = showOnHome !== false;
    if (homeOrder !== undefined) category.homeOrder = Number(homeOrder) || 0;
    if (description !== undefined) category.description = description?.trim() || null;
    if (imageUrl !== undefined) category.imageUrl = imageUrl || null;
    if (status !== undefined) category.status = status;
    if (isPopular !== undefined) category.isPopular = Boolean(isPopular);
    if (pricingLimits !== undefined) {
      category.pricingLimits = {
        minPrice: pricingLimits.minPrice !== undefined ? Number(pricingLimits.minPrice) : category.pricingLimits?.minPrice || 0,
        maxPrice: pricingLimits.maxPrice !== undefined ? Number(pricingLimits.maxPrice) : category.pricingLimits?.maxPrice || 999999
      };
    }
    if (paymentConfig !== undefined) {
      category.paymentConfig = {
        requireAdvancePayment: paymentConfig.requireAdvancePayment !== undefined
          ? Boolean(paymentConfig.requireAdvancePayment)
          : category.paymentConfig?.requireAdvancePayment || false,
        advancePaymentPercent: paymentConfig.advancePaymentPercent !== undefined
          ? Math.min(100, Math.max(0, Number(paymentConfig.advancePaymentPercent)))
          : category.paymentConfig?.advancePaymentPercent || 0
      };
    }
    if (bookingMode !== undefined) {
      const mode = String(bookingMode).toUpperCase();
      if (['INSTANT', 'SCHEDULED', 'BOTH', 'REQUEST_QUOTE'].includes(mode)) {
        category.bookingMode = mode;
        category.supportedBookingTypes = mode === 'BOTH'
          ? ['instant', 'scheduled', 'both']
          : [mode.toLowerCase()];
      }
    }
    if (serviceFulfillmentType !== undefined) {
      category.serviceFulfillmentType = String(serviceFulfillmentType).toUpperCase() === 'DELIVERY'
        ? 'DELIVERY'
        : 'ON_SITE';
    }
    if (trackingType !== undefined) {
      const nextTracking = String(trackingType).toLowerCase();
      if (['live', 'status_only', 'hybrid'].includes(nextTracking)) {
        category.trackingType = nextTracking;
      }
    }
    if (allowVendorBilling !== undefined) {
      category.allowVendorBilling = Boolean(allowVendorBilling);
    }
    if (metaTitle !== undefined) category.metaTitle = metaTitle?.trim() || null;
    if (metaDescription !== undefined) category.metaDescription = metaDescription?.trim() || null;

    if (updateCityIds !== undefined) {
      category.cityIds = updateCityIds;
      category.markModified('cityIds'); // Explicitly mark modified for array
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category: {
        id: category._id,
        title: category.title,
        slug: category.slug,
        homeIconUrl: category.homeIconUrl,
        homeBadge: category.homeBadge,
        hasSaleBadge: category.hasSaleBadge,
        showOnHome: category.showOnHome,
        homeOrder: category.homeOrder,
        description: category.description,
        imageUrl: category.imageUrl,
        status: category.status,
        isPopular: category.isPopular,
        pricingLimits: category.pricingLimits,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    });
  } catch (error) {
    console.error('Update category error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this title or slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update category. Please try again.'
    });
  }
};

/**
 * Delete category (soft delete - set status to deleted)
 * DELETE /api/admin/categories/:id
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Soft delete - set status to deleted
    category.status = SERVICE_STATUS.DELETED;
    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category. Please try again.'
    });
  }
};

/**
 * Update category order
 * PATCH /api/admin/categories/:id/order
 */
const updateCategoryOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { homeOrder } = req.body;

    if (homeOrder === undefined || isNaN(homeOrder)) {
      return res.status(400).json({
        success: false,
        message: 'homeOrder is required and must be a number'
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.homeOrder = Number(homeOrder);
    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category order updated successfully',
      category: {
        id: category._id,
        title: category.title,
        homeOrder: category.homeOrder
      }
    });
  } catch (error) {
    console.error('Update category order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category order. Please try again.'
    });
  }
};

/**
 * Get category form schema and booking configuration
 * GET /api/admin/categories/:id/form-schema
 */
const getCategoryFormSchema = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id).select('title slug supportedBookingTypes bookingMode defaultPricingModel formSchema vendorFormSchema catalogItemSchema pricingFormSchema availabilityFormSchema serviceAreaFormSchema bookingRulesFormSchema documentsFormSchema listingSectionConfig listingForms allowMultiSelect');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const settingsDoc = await Settings.findOne({ type: 'global' }).select('commonListingForms').lean();
    const commonListingForms = (settingsDoc?.commonListingForms || [])
      .filter((f) => f && f.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    res.status(200).json({
      success: true,
      categoryId: category._id,
      title: category.title,
      slug: category.slug,
      supportedBookingTypes: category.supportedBookingTypes || ['scheduled'],
      bookingMode: category.bookingMode || 'BOTH',
      defaultPricingModel: category.defaultPricingModel || 'FIXED',
      allowMultiSelect: Boolean(category.allowMultiSelect),
      formSchema: category.formSchema || [],
      vendorFormSchema: category.vendorFormSchema || [],
      catalogItemSchema: category.catalogItemSchema || [],
      pricingFormSchema: category.pricingFormSchema || [],
      availabilityFormSchema: category.availabilityFormSchema || [],
      serviceAreaFormSchema: category.serviceAreaFormSchema || [],
      bookingRulesFormSchema: category.bookingRulesFormSchema || [],
      documentsFormSchema: category.documentsFormSchema || [],
      listingSectionConfig: category.listingSectionConfig || {},
      listingForms: category.listingForms || [],
      commonListingForms
    });
  } catch (error) {
    console.error('Get category form schema error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category form schema.'
    });
  }
};

/**
 * Update category form schema and booking configuration
 * PUT /api/admin/categories/:id/form-schema
 */
const updateCategoryFormSchema = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      supportedBookingTypes, bookingMode, defaultPricingModel, allowMultiSelect,
      formSchema, vendorFormSchema, catalogItemSchema,
      pricingFormSchema, availabilityFormSchema, serviceAreaFormSchema,
      bookingRulesFormSchema, documentsFormSchema, listingSectionConfig,
      listingForms
    } = req.body;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (supportedBookingTypes !== undefined) {
      if (!Array.isArray(supportedBookingTypes) || supportedBookingTypes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one supported booking type (instant or scheduled) is required'
        });
      }
      category.supportedBookingTypes = supportedBookingTypes;
    }

    if (bookingMode !== undefined) category.bookingMode = bookingMode;
    if (defaultPricingModel !== undefined) category.defaultPricingModel = defaultPricingModel;

    if (allowMultiSelect !== undefined) {
      category.allowMultiSelect = Boolean(allowMultiSelect);
    }

    if (formSchema !== undefined) {
      if (!Array.isArray(formSchema)) {
        return res.status(400).json({
          success: false,
          message: 'formSchema must be an array'
        });
      }
      category.formSchema = formSchema;
    }

    if (vendorFormSchema !== undefined) {
      if (!Array.isArray(vendorFormSchema)) {
        return res.status(400).json({
          success: false,
          message: 'vendorFormSchema must be an array'
        });
      }
      category.vendorFormSchema = vendorFormSchema;
    }

    if (catalogItemSchema !== undefined) {
      if (!Array.isArray(catalogItemSchema)) {
        return res.status(400).json({
          success: false,
          message: 'catalogItemSchema must be an array'
        });
      }
      category.catalogItemSchema = catalogItemSchema;
    }

    const schemaArrays = {
      pricingFormSchema,
      availabilityFormSchema,
      serviceAreaFormSchema,
      bookingRulesFormSchema,
      documentsFormSchema
    };
    for (const [key, value] of Object.entries(schemaArrays)) {
      if (value === undefined) continue;
      if (!Array.isArray(value)) {
        return res.status(400).json({ success: false, message: `${key} must be an array` });
      }
      category[key] = value;
    }

    if (listingSectionConfig !== undefined) {
      category.listingSectionConfig = {
        ...(category.listingSectionConfig?.toObject?.() || category.listingSectionConfig || {}),
        ...listingSectionConfig
      };
      category.markModified('listingSectionConfig');
    }

    if (listingForms !== undefined) {
      if (!Array.isArray(listingForms)) {
        return res.status(400).json({ success: false, message: 'listingForms must be an array' });
      }
      category.listingForms = listingForms.map((f, idx) => ({
        id: String(f.id || `form_${Date.now()}_${idx}`),
        key: String(f.key || f.title || `form_${idx}`).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
        title: String(f.title || 'Untitled Form').trim(),
        type: ['fields', 'menu', 'photos'].includes(f.type) ? f.type : 'fields',
        enabled: f.enabled !== false,
        order: Number.isFinite(Number(f.order)) ? Number(f.order) : idx,
        fields: Array.isArray(f.fields) ? f.fields : []
      }));
      category.markModified('listingForms');
    }

    await category.save();

    // Broadcast real-time socket event so vendor form updates instantly
    try {
      const { getIO } = require('../../sockets');
      const io = getIO();
      if (io) {
        io.emit('category_schema_updated', {
          categoryId: category._id.toString(),
          title: category.title,
          vendorFormSchema: category.vendorFormSchema,
          catalogItemSchema: category.catalogItemSchema,
          pricingFormSchema: category.pricingFormSchema,
          listingSectionConfig: category.listingSectionConfig,
          listingForms: category.listingForms
        });
      }
    } catch (sErr) {
      console.warn('Socket emit warning:', sErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Category form schemas updated successfully',
      category: {
        id: category._id,
        title: category.title,
        supportedBookingTypes: category.supportedBookingTypes,
        bookingMode: category.bookingMode,
        defaultPricingModel: category.defaultPricingModel,
        allowMultiSelect: category.allowMultiSelect,
        formSchema: category.formSchema,
        vendorFormSchema: category.vendorFormSchema,
        catalogItemSchema: category.catalogItemSchema,
        pricingFormSchema: category.pricingFormSchema,
        availabilityFormSchema: category.availabilityFormSchema,
        serviceAreaFormSchema: category.serviceAreaFormSchema,
        bookingRulesFormSchema: category.bookingRulesFormSchema,
        documentsFormSchema: category.documentsFormSchema,
        listingSectionConfig: category.listingSectionConfig,
        listingForms: category.listingForms
      }
    });
  } catch (error) {
    console.error('Update category form schema error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category form schema. Please try again.'
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryOrder,
  getCategoryFormSchema,
  updateCategoryFormSchema
};


