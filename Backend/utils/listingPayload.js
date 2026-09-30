const crypto = require('crypto');
const cloudinaryService = require('../services/cloudinaryService');

const uploadDataUrlIfNeeded = async (value, folder) => {
  if (typeof value !== 'string' || !value.startsWith('data:')) return value;
  const up = await cloudinaryService.uploadFile(value, { folder });
  return up.success ? up.url : value;
};

const normalizeDynamicAnswers = async (answers = {}, vendorId) => {
  const out = {};
  for (const [key, value] of Object.entries(answers || {})) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      const cleaned = [];
      for (const item of value) {
        if (item === undefined || item === null || item === '') continue;
        cleaned.push(await uploadDataUrlIfNeeded(item, `vendors/listing_fields/${vendorId}`));
      }
      if (cleaned.length) out[key] = cleaned;
    } else {
      out[key] = await uploadDataUrlIfNeeded(value, `vendors/listing_fields/${vendorId}`);
    }
  }
  return out;
};

const coerceNumber = (value, fallback = undefined) => {
  if (value === '' || value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const coercePricing = (pricing = {}) => {
  const out = {};
  for (const [key, value] of Object.entries(pricing || {})) {
    const n = coerceNumber(value);
    if (n === undefined) continue;
    out[key] = n;
  }
  return out;
};

const buildHighlights = (answers = {}, schema = []) => {
  const schemaByKey = new Map((schema || []).map((f) => [f.key, f]));
  return Object.entries(answers || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0))
    .map(([key, value]) => {
      const field = schemaByKey.get(key);
      const type = field?.type || 'text';
      const isUrl = (v) => typeof v === 'string' && (v.startsWith('http') || v.startsWith('data:'));
      if (type === 'file' || isUrl(value) || (Array.isArray(value) && value.some(isUrl))) {
        const first = Array.isArray(value) ? value.find(isUrl) : value;
        const url = typeof first === 'string' && first.startsWith('http') ? first : null;
        return {
          key,
          label: field?.label || key.replace(/([A-Z_])/g, ' $1').trim(),
          value: url ? 'View file' : 'Uploaded',
          type: 'file',
          url
        };
      }
      const display = Array.isArray(value)
        ? value.join(', ')
        : typeof value === 'boolean'
          ? (value ? 'Yes' : 'No')
          : String(value);
      return {
        key,
        label: field?.label || key.replace(/([A-Z_])/g, ' $1').trim(),
        value: display,
        type
      };
    });
};

const pricingRows = (pricing = {}) =>
  Object.entries(pricing || {})
    .filter(([, v]) => v !== undefined && v !== null && Number(v) > 0)
    .map(([key, value]) => ({
      key,
      label: key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim(),
      amount: Number(value)
    }));

const coerceNestedNumbers = (obj = {}, keys = []) => {
  const out = { ...obj };
  keys.forEach((key) => {
    if (out[key] !== undefined) out[key] = coerceNumber(out[key], out[key]);
  });
  return out;
};

const CATALOG_CORE_KEYS = new Set([
  'id', '_id', 'title', 'name', 'description', 'price', 'photoUrl', 'photo', 'isActive',
  'requireAdvancePayment', 'advancePaymentPercent', 'serviceId', 'isAvailable'
]);

const normalizeCatalogItems = async (items = [], vendorId) => {
  const out = [];
  for (const item of items || []) {
    if (!item || typeof item !== 'object') continue;
    const title = String(item.title || item.name || '').trim();
    if (!title) continue;
    const photoUrl = await uploadDataUrlIfNeeded(item.photoUrl || item.photo || '', `vendors/services/catalog/${vendorId}`);
    const extras = {};
    for (const [key, value] of Object.entries(item)) {
      if (CATALOG_CORE_KEYS.has(key)) continue;
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) {
        const cleaned = [];
        for (const entry of value) {
          if (entry === undefined || entry === null || entry === '') continue;
          cleaned.push(await uploadDataUrlIfNeeded(entry, `vendors/services/catalog/${vendorId}`));
        }
        if (cleaned.length) extras[key] = cleaned;
      } else if (typeof value === 'string' && value.startsWith('data:')) {
        extras[key] = await uploadDataUrlIfNeeded(value, `vendors/services/catalog/${vendorId}`);
      } else {
        extras[key] = value;
      }
    }
    out.push({
      ...extras,
      id: String(item.id || item._id || crypto.randomUUID()),
      title,
      description: String(item.description || '').trim(),
      price: coerceNumber(item.price, 0) || 0,
      photoUrl: photoUrl || null,
      isActive: item.isActive !== false
    });
  }
  return out;
};

const toPublicCatalogItems = (items = [], schema = []) =>
  (items || [])
    .filter((item) => item && item.isActive !== false && item.title)
    .map((item) => {
      const extras = {};
      Object.entries(item).forEach(([key, value]) => {
        if (!CATALOG_CORE_KEYS.has(key)) extras[key] = value;
      });
      return {
        id: String(item.id || item._id || ''),
        title: item.title,
        description: item.description || '',
        price: Number(item.price) || 0,
        photoUrl: item.photoUrl || null,
        requireAdvancePayment: item.requireAdvancePayment === true,
        advancePaymentPercent: Number(item.advancePaymentPercent) || 0,
        highlights: buildHighlights(extras, schema)
      };
    });

const extractListingTitle = (profileAnswers = {}, catalogItems = []) => {
  const fromProfile =
    profileAnswers.title ||
    profileAnswers.shopName ||
    profileAnswers.businessName ||
    profileAnswers.shopTitle ||
    profileAnswers.name;
  if (fromProfile) return String(fromProfile).trim();
  const firstItem = (catalogItems || []).find((i) => i?.title?.trim());
  return firstItem?.title?.trim() || '';
};

module.exports = {
  normalizeDynamicAnswers,
  coerceNumber,
  coercePricing,
  coerceNestedNumbers,
  buildHighlights,
  pricingRows,
  normalizeCatalogItems,
  toPublicCatalogItems,
  extractListingTitle
};
