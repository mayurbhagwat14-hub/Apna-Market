import {
  FiInfo, FiFileText, FiDollarSign, FiClock, FiMapPin, FiImage, FiSettings, FiEye, FiLayers
} from 'react-icons/fi';

export const LISTING_SECTIONS = {
  profile: {
    schemaKey: 'vendorFormSchema',
    answersKey: 'dynamicFormAnswers',
    icon: FiFileText,
    defaultTitle: 'Shop Details & Location'
  },
  menu: {
    type: 'menu',
    icon: FiLayers,
    defaultTitle: 'Designs & Products Showcase'
  },
  pricing: {
    schemaKey: 'pricingFormSchema',
    answersKey: 'pricingFormAnswers',
    icon: FiDollarSign,
    defaultTitle: 'Pricing'
  },
  availability: {
    schemaKey: 'availabilityFormSchema',
    answersKey: 'availabilityFormAnswers',
    icon: FiClock,
    defaultTitle: 'Store Timings'
  },
  serviceArea: {
    schemaKey: 'serviceAreaFormSchema',
    answersKey: 'serviceAreaFormAnswers',
    icon: FiMapPin,
    defaultTitle: 'Shop Location & Address'
  },
  documents: {
    schemaKey: 'documentsFormSchema',
    answersKey: 'documentsFormAnswers',
    icon: FiImage,
    defaultTitle: 'Shop Photos & Banners',
    hasPhotos: true
  },
  bookingRules: {
    schemaKey: 'bookingRulesFormSchema',
    answersKey: 'bookingRulesFormAnswers',
    icon: FiSettings,
    defaultTitle: 'Store Policies'
  }
};

export const ADMIN_SCHEMA_OPTIONS = [
  { key: 'vendorFormSchema', label: 'Shop Details & Location', section: 'profile' },
  { key: 'catalogItemSchema', label: 'Designs & Products Showcase', section: 'menu' },
  { key: 'pricingFormSchema', label: 'Pricing', section: 'pricing' },
  { key: 'availabilityFormSchema', label: 'Store Timings', section: 'availability' },
  { key: 'serviceAreaFormSchema', label: 'Shop Location & Address', section: 'serviceArea' },
  { key: 'documentsFormSchema', label: 'Shop Photos & Banners', section: 'documents' },
  { key: 'bookingRulesFormSchema', label: 'Store Policies', section: 'bookingRules' }
];

const FORM_TYPE_ICONS = {
  fields: FiFileText,
  menu: FiLayers,
  photos: FiImage
};

export const isSectionEnabled = (category, sectionKey) => {
  const cfg = category?.listingSectionConfig?.[sectionKey];
  if (cfg && cfg.enabled === false) return false;
  return cfg?.enabled !== false;
};

export const sectionTitle = (category, sectionKey) => {
  const cfg = category?.listingSectionConfig?.[sectionKey];
  const meta = LISTING_SECTIONS[sectionKey];
  return cfg?.title || meta?.defaultTitle || sectionKey;
};

/** Merge global common forms with category-specific listing forms. */
export const mergeListingForms = (commonForms = [], categoryForms = []) => {
  const common = (commonForms || [])
    .filter((f) => f && f.enabled !== false && f.applyToAll !== false)
    .map((f, idx) => ({
      ...f,
      id: f.id || `common_${idx}`,
      isCommon: true
    }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const category = (categoryForms || [])
    .filter((f) => f && f.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const seenKeys = new Set();
  const merged = [];

  for (const form of common) {
    if (seenKeys.has(form.key)) continue;
    seenKeys.add(form.key);
    merged.push(form);
  }

  for (const form of category) {
    if (seenKeys.has(form.key)) {
      const idx = merged.findIndex((m) => m.key === form.key);
      if (idx >= 0) merged[idx] = { ...form, isCommon: false };
      continue;
    }
    seenKeys.add(form.key);
    merged.push(form);
  }

  return merged;
};

/** Prefer admin-created listingForms (+ common forms); fall back to legacy fixed sections. */
export const getActiveListingForms = (category, commonForms = []) => {
  const merged = mergeListingForms(
    commonForms?.length ? commonForms : category?.commonListingForms,
    category?.listingForms
  );

  let forms = merged;

  if (!forms.length) {
    // Legacy fallback from vendorFormSchema / catalog / section config
    const legacy = [];
    if ((category?.vendorFormSchema || []).length > 0 && isSectionEnabled(category, 'profile')) {
      legacy.push({
        id: 'legacy_profile',
        key: 'profile',
        title: sectionTitle(category, 'profile'),
        type: 'fields',
        fields: category.vendorFormSchema,
        order: 0
      });
    }
    Object.entries(LISTING_SECTIONS).forEach(([sectionKey, meta], idx) => {
      if (['profile', 'menu'].includes(sectionKey)) return;
      if (!isSectionEnabled(category, sectionKey)) return;
      const schema = category?.[meta.schemaKey] || [];
      if (!schema.length && !meta.hasPhotos) return;
      legacy.push({
        id: `legacy_${sectionKey}`,
        key: sectionKey,
        title: sectionTitle(category, sectionKey),
        type: meta.hasPhotos ? 'photos' : 'fields',
        fields: schema,
        order: idx + 2,
        answersKey: meta.answersKey
      });
    });
    forms = legacy;
  }

  // Every service category gets packages/blocks (Driver, Tiffin, Guard, etc.)
  return ensurePackagesForm(forms, category);
};

/**
 * Guarantee a packages/menu form exists for any category so vendors can
 * add bookable blocks without depending on Driver-only admin config.
 */
export const ensurePackagesForm = (forms = [], category = null) => {
  const list = Array.isArray(forms) ? [...forms] : [];
  if (list.some((f) => f?.type === 'menu')) return list;

  const menuTitle = sectionTitle(category, 'menu') || 'Packages & Blocks';
  // Insert after first fields/profile form when possible
  const insertAt = Math.max(
    0,
    list.findIndex((f) => f?.type === 'fields') + 1
  );
  const packageForm = {
    id: 'auto_packages',
    key: 'menu',
    title: menuTitle === 'Menu' ? 'Packages & Blocks' : menuTitle,
    type: 'menu',
    fields: category?.catalogItemSchema || [],
    order: insertAt,
    enabled: true
  };
  list.splice(insertAt, 0, packageForm);
  return list;
};

export const buildListingSteps = (category, commonForms = []) => {
  const steps = [{ key: 'category', label: 'Category', icon: FiInfo }];

  if (!category) {
    steps.push({ key: 'preview', label: 'Preview', icon: FiEye });
    return steps;
  }

  steps.push({
    key: 'details',
    label: 'Shop Details & Location',
    icon: FiFileText,
    type: 'details',
    schema: category?.vendorFormSchema || []
  });

  steps.push({
    key: 'photos',
    label: 'Photos & Banner Ads',
    icon: FiImage,
    type: 'photos'
  });

  steps.push({
    key: 'offers',
    label: 'Special Offers',
    icon: FiTag,
    type: 'offers'
  });

  steps.push({
    key: 'products',
    label: 'Designs & Clothes',
    icon: FiLayers,
    type: 'products',
    schema: category?.catalogItemSchema || []
  });

  steps.push({ key: 'preview', label: 'Preview & Publish', icon: FiEye });
  return steps;
};

export const validateDynamicSchema = (schema = [], values = {}) => {
  for (const field of schema) {
    if (!field.required) continue;
    const val = values[field.key];
    if (val === undefined || val === null || val === '') {
      return `${field.label} is required`;
    }
    if (Array.isArray(val) && val.length === 0) {
      return `${field.label} is required`;
    }
  }
  return null;
};

export const extractListingTitle = (profileAnswers = {}, catalogItems = [], listingFormAnswers = {}) => {
  const fromProfile =
    profileAnswers.title ||
    profileAnswers.shopName ||
    profileAnswers.boutiqueName ||
    profileAnswers.businessName ||
    profileAnswers.shopTitle ||
    profileAnswers.name;
  if (fromProfile) return String(fromProfile).trim();

  for (const answers of Object.values(listingFormAnswers || {})) {
    if (!answers || typeof answers !== 'object') continue;
    const t = answers.title || answers.shopName || answers.businessName || answers.name;
    if (t) return String(t).trim();
  }

  const firstItem = (catalogItems || []).find((i) => i?.title?.trim());
  return firstItem?.title?.trim() || '';
};

export const extractListingDescription = (profileAnswers = {}) =>
  String(profileAnswers.description || profileAnswers.about || profileAnswers.summary || '').trim();

export const extractShortDescription = (profileAnswers = {}) =>
  String(profileAnswers.shortDescription || profileAnswers.tagline || profileAnswers.subtitle || '').trim();

export const slugifyFormKey = (title = '') =>
  String(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || `form_${Date.now()}`;
