/**
 * Normalize a listing form definition from admin input.
 */
const normalizeListingForm = (f, idx = 0, prefix = 'form') => ({
  id: String(f.id || `${prefix}_${Date.now()}_${idx}`),
  key: String(f.key || f.title || `form_${idx}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, ''),
  title: String(f.title || 'Untitled Form').trim(),
  type: ['fields', 'menu', 'photos'].includes(f.type) ? f.type : 'fields',
  enabled: f.enabled !== false,
  applyToAll: f.applyToAll !== false,
  order: Number.isFinite(Number(f.order)) ? Number(f.order) : idx,
  fields: Array.isArray(f.fields) ? f.fields : [],
  source: f.source || null,
  commonFormId: f.commonFormId || null
});

/**
 * Merge global common forms with category-specific forms.
 * Common forms (applyToAll !== false) appear first; category forms can override by key.
 */
const mergeListingForms = (commonForms = [], categoryForms = []) => {
  const common = (commonForms || [])
    .filter((f) => f && f.enabled !== false && f.applyToAll !== false)
    .map((f, idx) => ({
      ...normalizeListingForm(f, idx, 'common'),
      isCommon: true,
      formId: `common_${f.id || idx}`
    }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const category = (categoryForms || [])
    .filter((f) => f && f.enabled !== false)
    .map((f, idx) => normalizeListingForm(f, idx, 'cat'))
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
      // Category-specific form overrides common form with same key
      const idx = merged.findIndex((m) => m.key === form.key);
      if (idx >= 0) merged[idx] = { ...form, isCommon: false };
      continue;
    }
    seenKeys.add(form.key);
    merged.push(form);
  }

  return merged;
};

/**
 * Ensure every category can collect packages/blocks (not only Driver).
 */
const ensurePackagesForm = (forms = [], category = null) => {
  const list = Array.isArray(forms) ? [...forms] : [];
  if (list.some((f) => f?.type === 'menu')) return list;

  const title =
    category?.listingSectionConfig?.menu?.title &&
    category.listingSectionConfig.menu.title !== 'Menu'
      ? category.listingSectionConfig.menu.title
      : 'Packages & Blocks';

  const insertAt = Math.max(0, list.findIndex((f) => f?.type === 'fields') + 1);
  list.splice(insertAt, 0, {
    id: 'auto_packages',
    key: 'menu',
    title,
    type: 'menu',
    enabled: true,
    order: insertAt,
    fields: category?.catalogItemSchema || []
  });
  return list;
};

const resolveListingForms = (commonForms = [], category = null) => {
  const merged = mergeListingForms(commonForms, category?.listingForms || []);
  return ensurePackagesForm(merged, category);
};

module.exports = {
  normalizeListingForm,
  mergeListingForms,
  ensurePackagesForm,
  resolveListingForms
};
