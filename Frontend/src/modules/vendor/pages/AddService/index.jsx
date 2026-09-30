import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FiArrowLeft, FiCheck, FiChevronRight, FiChevronLeft, FiSave, FiSend,
  FiInfo, FiFileText, FiDollarSign, FiClock, FiMapPin, FiImage, FiSettings, FiEye,
  FiAlertCircle, FiLoader, FiLayers, FiPlus, FiTrash2
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';
import DynamicField, { FormInput, FormTextarea, DynamicFormFields } from '../../components/common/DynamicField';
import {
  buildListingSteps,
  validateDynamicSchema,
  extractListingTitle,
  getActiveListingForms
} from '../../utils/listingFormConfig';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

const EMPTY_FORM = {
  categoryId: '',
  title: '',
  description: '',
  shortDescription: '',
  bookingMode: 'BOTH',
  dynamicFormAnswers: {},
  pricingFormAnswers: {},
  availabilityFormAnswers: {},
  serviceAreaFormAnswers: {},
  bookingRulesFormAnswers: {},
  documentsFormAnswers: {},
  listingFormAnswers: {},
  portfolioPhotos: [],
  documents: [],
  catalogItems: [],
};

const emptyCatalogItem = () => ({
  id: crypto.randomUUID(),
  title: '',
  description: '',
  price: '',
  photoUrl: null,
  isActive: true
});

const listingModeOptions = (categoryMode = 'BOTH') => {
  const allowed = String(categoryMode || 'BOTH').toUpperCase();
  if (allowed === 'INSTANT') return [['INSTANT', '⚡ Instant']];
  if (allowed === 'SCHEDULED') return [['SCHEDULED', '📅 Scheduled']];
  if (allowed === 'REQUEST_QUOTE') return [['REQUEST_QUOTE', '💬 Quote Only']];
  return [
    ['INSTANT', '⚡ Instant'],
    ['SCHEDULED', '📅 Scheduled'],
    ['BOTH', '✅ Both'],
  ];
};

// ─── MAIN COMPONENT ───
const AddService = () => {
  const navigate = useNavigate();
  const { categorySlug, serviceId } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(serviceId);
  const packagesOnly = isEdit && searchParams.get('mode') === 'packages';

  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [commonListingForms, setCommonListingForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serviceMeta, setServiceMeta] = useState(null);

  // ─── FORM STATE ───
  const [form, setForm] = useState(EMPTY_FORM);

  const selectedCategory = useMemo(
    () => categories.find(c => (c.id || c._id) === form.categoryId),
    [categories, form.categoryId]
  );

  const menuSchema = useMemo(() => {
    const forms = getActiveListingForms(selectedCategory, commonListingForms);
    const menuForm = forms.find((f) => f.type === 'menu');
    return menuForm?.fields || selectedCategory?.catalogItemSchema || [];
  }, [selectedCategory, commonListingForms]);

  const steps = useMemo(
    () => buildListingSteps(selectedCategory, commonListingForms),
    [selectedCategory, commonListingForms]
  );
  const currentStep = steps[step] || steps[0];

  // ─── LOAD DATA ───
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const catRes = await api.get('/vendors/categories', { cacheTtl: 90 });
        if (cancelled) return;
        if (catRes.data?.categories) {
          setCategories(catRes.data.categories);
          setCommonListingForms(catRes.data.commonListingForms || []);
          if (categorySlug) {
            const match = catRes.data.categories.find(c => c.slug === categorySlug);
            if (match) setForm(p => ({ ...p, categoryId: match.id || match._id }));
          }
        }

        if (serviceId) {
          const svcRes = await api.get(`/vendors/services/${serviceId}/detail`, { cacheTtl: 20 });
          if (cancelled) return;
          if (svcRes.data?.service) {
            const s = svcRes.data.service;
            setServiceMeta({
              title: s.title,
              categoryName: s.categoryName || s.categoryId?.title,
              status: s.status,
              hasPendingEdits: s.hasPendingEdits
            });
            setForm({
              ...EMPTY_FORM,
              categoryId: s.categoryId?._id || s.categoryId || '',
              title: s.title || '',
              description: s.description || '',
              shortDescription: s.shortDescription || '',
              dynamicFormAnswers: s.dynamicFormAnswers || {},
              pricingFormAnswers: s.pricingFormAnswers || {},
              availabilityFormAnswers: s.availabilityFormAnswers || {},
              serviceAreaFormAnswers: s.serviceAreaFormAnswers || {},
              bookingRulesFormAnswers: s.bookingRulesFormAnswers || {},
              documentsFormAnswers: s.documentsFormAnswers || {},
              listingFormAnswers: s.listingFormAnswers || {},
              portfolioPhotos: s.portfolioPhotos || [],
              documents: s.documents || [],
              catalogItems: (s.catalogItems || []).length ? s.catalogItems : [emptyCatalogItem()],
              bookingMode: s.bookingMode || s.categoryId?.bookingMode || 'BOTH',
            });
            // Skip category step on full edit (packages-only UI ignores step)
            setStep(1);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading data:', err);
          toast.error('Failed to load categories');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [categorySlug, serviceId]);

  // ─── FORM HELPERS ───
  const updateForm = (key, value) => setForm(p => ({ ...p, [key]: value }));
  const selectCategory = (cat) => {
    const catId = cat.id || cat._id;
    const enrollmentAnswers = cat.enrollment?.dynamicAnswers || {};
    setForm((p) => ({
      ...p,
      categoryId: catId,
      bookingMode: cat.bookingMode === 'BOTH' ? (p.bookingMode || 'BOTH') : (cat.bookingMode || 'BOTH'),
      dynamicFormAnswers: Object.keys(p.dynamicFormAnswers || {}).length && p.categoryId === catId
        ? p.dynamicFormAnswers
        : enrollmentAnswers,
      catalogItems: (p.catalogItems?.length && p.categoryId === catId)
        ? p.catalogItems
        : [{
          id: crypto.randomUUID(),
          title: '',
          description: '',
          price: '',
          photoUrl: null,
          isActive: true
        }]
    }));
  };
  const updateNested = (parent, key, value) => setForm(p => ({ ...p, [parent]: { ...p[parent], [key]: value } }));
  const updateDynamic = (key, value) => setForm(p => ({ ...p, dynamicFormAnswers: { ...p.dynamicFormAnswers, [key]: value } }));
  const toggleDynamicMulti = (key, value) => {
    setForm(p => {
      const current = Array.isArray(p.dynamicFormAnswers[key]) ? p.dynamicFormAnswers[key] : [];
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...p, dynamicFormAnswers: { ...p.dynamicFormAnswers, [key]: updated } };
    });
  };

  // ─── NAVIGATION ───
  const updateSectionAnswer = (answersKey, key, value) => {
    setForm((p) => ({ ...p, [answersKey]: { ...p[answersKey], [key]: value } }));
  };
  const toggleSectionMulti = (answersKey, key, value) => {
    setForm((p) => {
      const current = Array.isArray(p[answersKey]?.[key]) ? p[answersKey][key] : [];
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...p, [answersKey]: { ...p[answersKey], [key]: updated } };
    });
  };

  const getStepAnswers = (stepDef) => {
    if (!stepDef) return {};
    if (stepDef.answersKey) return form[stepDef.answersKey] || {};
    if (stepDef.formId) return form.listingFormAnswers?.[stepDef.formId] || {};
    return {};
  };

  const updateListingFormAnswer = (formId, key, value) => {
    setForm((p) => ({
      ...p,
      listingFormAnswers: {
        ...p.listingFormAnswers,
        [formId]: { ...(p.listingFormAnswers?.[formId] || {}), [key]: value }
      }
    }));
  };

  const toggleListingFormMulti = (formId, key, value) => {
    setForm((p) => {
      const bucket = p.listingFormAnswers?.[formId] || {};
      const current = Array.isArray(bucket[key]) ? bucket[key] : [];
      const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return {
        ...p,
        listingFormAnswers: {
          ...p.listingFormAnswers,
          [formId]: { ...bucket, [key]: updated }
        }
      };
    });
  };

  const canGoNext = () => {
    if (!currentStep) return false;
    if (currentStep.key === 'category') return Boolean(form.categoryId);
    if (currentStep.type === 'menu' || currentStep.key === 'menu') {
      return form.catalogItems.some((item) => (item.title || '').trim());
    }
    if (currentStep.schema?.length && currentStep.type !== 'photos') {
      const err = validateDynamicSchema(currentStep.schema, getStepAnswers(currentStep));
      if (err) return false;
    }
    return true;
  };
  const goNext = () => {
    if (!canGoNext()) {
      if (currentStep?.schema?.length) {
        const err = validateDynamicSchema(currentStep.schema, getStepAnswers(currentStep));
        if (err) toast.error(err);
      } else if (currentStep?.type === 'menu' || currentStep?.key === 'menu') {
        toast.error('Add at least one package option with a name');
      }
      return;
    }
    if (step < steps.length - 1) setStep(s => s + 1);
  };
  const goBack = () => { if (step > 0) setStep(s => s - 1); };

  // ─── SUBMIT ───
  const handleSubmit = async (isDraft = false) => {
    try {
      setSubmitting(true);
      const resolvedTitle = extractListingTitle(form.dynamicFormAnswers, form.catalogItems, form.listingFormAnswers);
      const payload = {
        categoryId: form.categoryId,
        title: resolvedTitle,
        description: form.dynamicFormAnswers.description || form.dynamicFormAnswers.about || form.description || '',
        shortDescription: form.dynamicFormAnswers.shortDescription || form.dynamicFormAnswers.tagline || form.shortDescription || '',
        dynamicFormAnswers: form.dynamicFormAnswers,
        pricingFormAnswers: form.pricingFormAnswers,
        availabilityFormAnswers: form.availabilityFormAnswers,
        serviceAreaFormAnswers: form.serviceAreaFormAnswers,
        bookingRulesFormAnswers: form.bookingRulesFormAnswers,
        documentsFormAnswers: form.documentsFormAnswers,
        listingFormAnswers: form.listingFormAnswers,
        portfolioPhotos: form.portfolioPhotos,
        documents: form.documents,
        catalogItems: form.catalogItems,
        bookingMode: form.bookingMode || selectedCategory?.bookingMode || 'BOTH',
        isDraft
      };
      
      let res;
      if (isEdit) {
        res = await api.patch(`/vendors/services/${serviceId}`, payload);
      } else {
        res = await api.post('/vendors/services', payload);
      }

      if (res.data?.success) {
        const defaultMsg = isDraft
          ? 'Draft saved!'
          : isEdit
            ? 'Details sent for admin approval. Customers still see the last approved version until then.'
            : 'Submitted for admin approval. Visible to customers after approval.';
        toast.success(res.data.message || defaultMsg);
        navigate('/vendor/my-services');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save service');
    } finally {
      setSubmitting(false);
    }
  };

  /** Save packages (edit existing + add new) — business details stay; admin must re-approve */
  const handleSubmitPackages = async () => {
    const items = (form.catalogItems || []).filter((p) => (p.title || '').trim());
    if (!items.length) {
      toast.error('Keep at least one package with a name');
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.patch(`/vendors/services/${serviceId}`, {
        catalogItems: items,
        isDraft: false
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Packages sent for admin approval. Live listing stays until approved.');
        navigate('/vendor/my-services');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save packages');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── RENDER ───
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (packagesOnly) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/vendor/my-services')}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 active:scale-95"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-black text-slate-900 truncate">Manage Packages</h1>
              <p className="text-[10px] font-bold text-primary-600 truncate">
                {serviceMeta?.categoryName || selectedCategory?.title || 'Service'}
                {serviceMeta?.title ? ` · ${serviceMeta.title}` : ''}
              </p>
            </div>
          </div>
        </header>

        <main className="p-4 max-w-lg mx-auto space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-sm">
            <p className="text-[11px] font-black text-slate-800 uppercase tracking-wide">Business already saved</p>
            <p className="text-xs text-slate-500 mt-1">
              Edit existing packages or add new ones here. Company details stay the same. Changes go live only after admin approval.
            </p>
            {serviceMeta?.hasPendingEdits && (
              <p className="text-[10px] font-semibold text-amber-800 mt-2 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
                You already have updates under review. Saving again updates that pending review.
              </p>
            )}
          </div>

          <PackageDraftList
            items={form.catalogItems?.length ? form.catalogItems : [emptyCatalogItem()]}
            setItems={(updater) => {
              setForm((p) => ({
                ...p,
                catalogItems: typeof updater === 'function'
                  ? updater(p.catalogItems?.length ? p.catalogItems : [emptyCatalogItem()])
                  : updater
              }));
            }}
            schema={menuSchema}
            heading={`Packages (${(form.catalogItems || []).filter((i) => (i.title || '').trim()).length || (form.catalogItems || []).length})`}
            helper={`Edit any package below or tap “Add another package”. Customers see the last approved set until admin approves.`}
            showApprovalNote
            minItems={1}
          />
        </main>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-30">
          <div className="max-w-lg mx-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/vendor/edit-service/${serviceId}`)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Edit full details
            </button>
            <button
              type="button"
              onClick={handleSubmitPackages}
              disabled={submitting || !(form.catalogItems || []).some((p) => (p.title || '').trim())}
              className="flex-1 flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-40 shadow-sm"
            >
              {submitting ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => step > 0 ? goBack() : navigate(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 active:scale-95">
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-slate-900 truncate">
              {isEdit ? 'Edit Service' : 'Add Service'}
            </h1>
            {selectedCategory && (
              <p className="text-[10px] font-bold text-primary-600 truncate">{selectedCategory.title}</p>
            )}
          </div>
          <span className="text-xs font-bold text-slate-400">{step + 1}/{steps.length}</span>
        </div>

        <div className="mt-3 flex gap-1">
          {steps.map((s, i) => (
            <div key={s.key + i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < step ? 'bg-primary-500' : i === step ? 'bg-primary-400' : 'bg-slate-200'}`} />
          ))}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          {currentStep?.icon && React.createElement(currentStep.icon, { className: 'w-3.5 h-3.5 text-primary-600' })}
          <span className="text-xs font-bold text-slate-700">{currentStep?.label}</span>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {isEdit && (
          <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 p-3">
            <p className="text-[11px] font-semibold text-amber-900">
              You can edit business details and packages. Changes appear for customers only after admin approval. Until then the last approved version stays live.
            </p>
          </div>
        )}
        {currentStep?.key === 'category' && (
          <>
            <StepCategory categories={categories} form={form} onSelectCategory={selectCategory} />
            {selectedCategory && (
              <div className="mt-4 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <p className="text-xs font-black text-slate-800 mb-1">Listing booking mode</p>
                <p className="text-[10px] text-slate-500 mb-3">
                  Allowed by admin for {selectedCategory.title}: {selectedCategory.bookingMode || 'BOTH'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {listingModeOptions(selectedCategory.bookingMode).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => updateForm('bookingMode', val)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        form.bookingMode === val
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {(currentStep?.type === 'menu' || currentStep?.key === 'menu') && (
          <StepMenuItems form={form} setForm={setForm} category={selectedCategory} itemSchema={currentStep.schema} stepTitle={currentStep.label} />
        )}
        {(currentStep?.type === 'photos' || currentStep?.key === 'documents') && (
          <>
            {currentStep.schema?.length > 0 && (
              <StepDynamicSection
                title={currentStep.label}
                schema={currentStep.schema}
                values={getStepAnswers(currentStep)}
                onChange={(k, v) => {
                  if (currentStep.formId) updateListingFormAnswer(currentStep.formId, k, v);
                  else updateSectionAnswer(currentStep.answersKey || 'documentsFormAnswers', k, v);
                }}
                onToggleMulti={(k, v) => {
                  if (currentStep.formId) toggleListingFormMulti(currentStep.formId, k, v);
                  else toggleSectionMulti(currentStep.answersKey || 'documentsFormAnswers', k, v);
                }}
              />
            )}
            <StepDocuments form={form} setForm={setForm} />
          </>
        )}
        {currentStep?.type === 'fields' && currentStep.schema?.length > 0 && (
          <StepDynamicSection
            title={currentStep.label}
            schema={currentStep.schema}
            values={getStepAnswers(currentStep)}
            onChange={(k, v) => {
              if (currentStep.formId) updateListingFormAnswer(currentStep.formId, k, v);
              else if (currentStep.answersKey) updateSectionAnswer(currentStep.answersKey, k, v);
            }}
            onToggleMulti={(k, v) => {
              if (currentStep.formId) toggleListingFormMulti(currentStep.formId, k, v);
              else if (currentStep.answersKey) toggleSectionMulti(currentStep.answersKey, k, v);
            }}
          />
        )}
        {currentStep?.key === 'preview' && <StepPreview form={form} category={selectedCategory} />}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-30">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {step > 0 && (
            <button onClick={goBack} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all">
              <FiChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <div className="flex-1" />

          {step < steps.length - 1 ? (
            <div className="flex items-center gap-2">
              <button onClick={() => handleSubmit(true)} disabled={submitting || !form.categoryId}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40">
                <FiSave className="w-3.5 h-3.5 inline mr-1" />Save Draft
              </button>
              <button onClick={goNext} disabled={!canGoNext()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-40 shadow-sm">
                Next <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => handleSubmit(true)} disabled={submitting}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40">
                <FiSave className="w-3.5 h-3.5 inline mr-1" />Save Draft
              </button>
              <button onClick={() => handleSubmit(false)} disabled={submitting || !form.categoryId || !extractListingTitle(form.dynamicFormAnswers, form.catalogItems, form.listingFormAnswers)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-40 shadow-sm">
                {submitting ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
                {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// DYNAMIC SECTION (admin-defined fields only)
// ════════════════════════════════════════════════════════════════
const StepDynamicSection = ({ title, schema, values, onChange, onToggleMulti }) => (
  <div className="space-y-4">
    <div className="bg-primary-50 rounded-xl p-3.5 border border-primary-100">
      <h3 className="text-sm font-black text-primary-900">{title}</h3>
      <p className="text-xs text-primary-700 mt-0.5">
        Fill company name, about your business, and other details for this service. Customers see this on your profile.
      </p>
    </div>
    {schema.length === 0 ? (
      <p className="text-xs text-slate-500">No fields configured yet. Ask admin to add fields for this section.</p>
    ) : (
      <SectionCard title={title} icon="⚙️">
        <DynamicFormFields schema={schema} values={values} onChange={onChange} onToggleMulti={onToggleMulti} />
      </SectionCard>
    )}
  </div>
);

// ════════════════════════════════════════════════════════════════
// STEP 1: CATEGORY SELECTION
// ════════════════════════════════════════════════════════════════
const StepCategory = ({ categories, form, onSelectCategory }) => (
  <div className="space-y-4">
    <div className="bg-primary-50 rounded-xl p-3.5 border border-primary-100">
      <h3 className="text-sm font-black text-primary-900">Select Your Service</h3>
      <p className="text-xs text-primary-700 mt-0.5">
        Pick any service you provide. Fill company details once, then add packages. Later you can add more packages without re-filling the full form.
      </p>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {categories.map(cat => {
        const catId = cat.id || cat._id;
        const isSelected = form.categoryId === catId;
        const hasListing = cat.existingListing;
        return (
          <button key={catId} onClick={() => !hasListing && onSelectCategory(cat)} disabled={!!hasListing}
            className={`relative p-3.5 rounded-xl border-2 text-left transition-all active:scale-[0.97] ${
              isSelected ? 'border-primary-500 bg-primary-50 shadow-md ring-2 ring-primary-200' :
              hasListing ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed' :
              'border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm'
            }`}>
            {isSelected && <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"><FiCheck className="w-3 h-3 text-white" /></div>}
            {cat.iconUrl && <img src={cat.iconUrl} alt="" className="w-8 h-8 rounded-lg mb-2 object-contain bg-white" />}
            <h4 className={`text-xs font-black ${isSelected ? 'text-primary-900' : 'text-slate-800'}`}>{cat.title}</h4>
            {hasListing && <span className="text-[9px] font-bold text-amber-600 mt-1 block">Already Added</span>}
            {cat.defaultPricingModel && !hasListing && (
              <span className="text-[9px] font-medium text-slate-400 mt-0.5 block">{cat.defaultPricingModel}</span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════
// STEP 2: SERVICE DETAILS (Dynamic Form from vendorFormSchema)
// ════════════════════════════════════════════════════════════════
const StepDetails = ({ form, updateForm, updateDynamic, toggleDynamicMulti, category }) => {
  const vendorSchema = category?.vendorFormSchema || [];

  return (
    <div className="space-y-4">
      {/* Basic Fields */}
      <SectionCard title="Basic Information" icon="📝">
        <FormInput label="Shop / Business Name *" value={form.title} onChange={v => updateForm('title', v)} placeholder="e.g. Sharma Tiffin Centre / Raj Driver Service" />
        <FormInput label="Short Tagline" value={form.shortDescription} onChange={v => updateForm('shortDescription', v)} placeholder="One line for the list card" />
        <FormTextarea label="Description" value={form.description} onChange={v => updateForm('description', v)} placeholder="Describe your service in detail..." rows={3} />
        <FormInput label="Years of Experience" type="number" value={form.experience} onChange={v => updateForm('experience', v)} placeholder="e.g. 5" />
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Languages Spoken</label>
          <input type="text" value={(form.languages || []).join(', ')} onChange={e => updateForm('languages', e.target.value.split(',').map(l => l.trim()).filter(Boolean))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
            placeholder="Hindi, English, Marathi" />
        </div>
      </SectionCard>

      {/* Dynamic Category-Specific Fields */}
      {vendorSchema.length > 0 && (
        <SectionCard title={`${category?.title || 'Service'} Details`} icon="⚙️">
          <DynamicFormFields
            schema={vendorSchema}
            values={form.dynamicFormAnswers}
            onChange={updateDynamic}
            onToggleMulti={toggleDynamicMulti}
          />
        </SectionCard>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// STEP 3: PRICING
// ════════════════════════════════════════════════════════════════
const StepPricing = ({ form, updateForm, updateNested, category }) => {
  const pricingModel = form.pricingModel;

  const PRICING_FIELDS = {
    FIXED: [['basePrice', 'Base Price (₹)'], ['visitingCharge', 'Visiting Charge (₹)'], ['labourCharge', 'Labour Charge (₹)'], ['emergencyCharge', 'Emergency Charge (₹)']],
    PER_VISIT: [['basePrice', 'Per Visit Charge (₹)'], ['visitingCharge', 'Visiting Charge (₹)'], ['emergencyCharge', 'Emergency Charge (₹)']],
    HOURLY: [['hourlyRate', 'Per Hour Rate (₹)'], ['halfDayRate', 'Half Day (4hr) Rate (₹)'], ['fullDayRate', 'Full Day (8hr) Rate (₹)'], ['nightCharge', 'Night Charge (₹)'], ['emergencyCharge', 'Emergency (₹)']],
    DAILY: [['dailyRate', 'Per Day Rate (₹)'], ['halfDayRate', 'Half Day Rate (₹)'], ['nightCharge', 'Night Charge (₹)'], ['outstationPrice', 'Outstation Rate (₹)'], ['driverAllowance', 'Allowance (₹)']],
    MONTHLY: [['monthlyRent', 'Monthly Rate (₹)'], ['securityDeposit', 'Security Deposit (₹)'], ['maintenanceCharge', 'Maintenance (₹)'], ['deliveryCharge', 'Delivery/Setup (₹)']],
    YEARLY: [['yearlyRent', 'Yearly Rate (₹)'], ['securityDeposit', 'Security Deposit (₹)']],
    PER_UNIT: [['basePrice', 'Per Unit Price (₹)'], ['perSqftRate', 'Per Sq.Ft Rate (₹)'], ['inspectionCharge', 'Inspection (₹)']],
    CUSTOM_QUOTE: [['basePrice', 'Starting From (₹)']],
  };

  const fields = PRICING_FIELDS[pricingModel] || PRICING_FIELDS.FIXED;

  return (
    <div className="space-y-4">
      <SectionCard title="Pricing Model" icon="💰">
        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">How do you charge?</label>
        <div className="grid grid-cols-2 gap-2">
          {['FIXED', 'PER_VISIT', 'HOURLY', 'DAILY', 'MONTHLY', 'PER_UNIT', 'CUSTOM_QUOTE'].map(model => (
            <button key={model} type="button" onClick={() => updateForm('pricingModel', model)}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all active:scale-95 ${
                pricingModel === model ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}>
              {model.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Set Your Prices" icon="₹">
        <div className="grid grid-cols-2 gap-3">
          {fields.map(([key, label]) => (
            <FormInput key={key} label={label} type="number" value={form.pricing[key] || ''} onChange={v => updateNested('pricing', key, Number(v) || 0)} placeholder="0" />
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// PACKAGE / BLOCK EDITOR (shared by full wizard + add-package mode)
// ════════════════════════════════════════════════════════════════
const PackageDraftList = ({
  items,
  setItems,
  schema = [],
  heading = 'Packages & Blocks',
  helper = '',
  minItems = 1,
  showApprovalNote = false
}) => {
  const addItem = () => setItems((prev) => [...prev, emptyCatalogItem()]);

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeItem = (index) => {
    setItems((prev) => {
      if (prev.length <= minItems) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handlePhotoUpload = (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateItem(index, 'photoUrl', reader.result);
    reader.readAsDataURL(file);
  };

  const toggleMulti = (index, key, value) => {
    setItems((prev) => {
      const next = [...prev];
      const current = Array.isArray(next[index][key]) ? next[index][key] : [];
      const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      next[index] = { ...next[index], [key]: updated };
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-primary-50 rounded-xl p-3.5 border border-primary-100">
        <h3 className="text-sm font-black text-primary-900">{heading}</h3>
        {helper ? <p className="text-xs text-primary-700 mt-0.5">{helper}</p> : null}
        {showApprovalNote && (
          <p className="text-[10px] text-amber-800 font-semibold mt-2 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
            New or changed packages go live only after admin approval.
          </p>
        )}
      </div>

      {(items || []).map((item, index) => (
        <SectionCard key={item.id || index} title={`Package ${index + 1}`} icon="🏷️">
          <div className="flex gap-3">
            <div className="flex-1 space-y-3">
              <FormInput label="Package name *" value={item.title || ''} onChange={(v) => updateItem(index, 'title', v)} placeholder="e.g. Standard / Premium / Half-day" />
              <FormInput label="Price (₹) *" type="number" value={item.price || ''} onChange={(v) => updateItem(index, 'price', v)} placeholder="e.g. 500" />
              <FormTextarea label="What's included" value={item.description || ''} onChange={(v) => updateItem(index, 'description', v)} placeholder="Describe this package..." rows={2} />
              {schema.length > 0 && (
                [...schema]
                  .filter((field) => !['title', 'price', 'description'].includes(field.key))
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((field) => (
                    <DynamicField
                      key={field.key}
                      field={field}
                      value={item[field.key]}
                      onChange={(v) => updateItem(index, field.key, v)}
                      onToggleMulti={(v) => toggleMulti(index, field.key, v)}
                    />
                  ))
              )}
            </div>
            <div className="w-24 shrink-0 flex flex-col items-center space-y-2">
              <label className="w-full aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 overflow-hidden relative">
                {item.photoUrl ? (
                  <img src={item.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <FiImage className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-[10px] font-bold text-slate-400">Photo</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, index)} />
              </label>
              <ToggleRow label="Active" value={item.isActive} onChange={(v) => updateItem(index, 'isActive', v)} />
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-red-500 hover:text-red-700 p-2 disabled:opacity-30"
                disabled={(items || []).length <= minItems}
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </SectionCard>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="w-full py-3 rounded-xl border-2 border-dashed border-primary-300 text-primary-600 font-bold flex items-center justify-center gap-2 hover:bg-primary-50 transition-colors"
      >
        <FiPlus className="w-4 h-4" /> Add another package / block
      </button>
    </div>
  );
};

const StepMenuItems = ({ form, setForm, category, itemSchema, stepTitle }) => {
  const schema = itemSchema || category?.catalogItemSchema || [];
  const categoryTitle = category?.title || 'this service';

  React.useEffect(() => {
    if (!form.catalogItems?.length) {
      setForm((p) => (p.catalogItems?.length ? p : { ...p, catalogItems: [emptyCatalogItem()] }));
    }
  }, []);

  return (
    <PackageDraftList
      items={form.catalogItems}
      setItems={(updater) => {
        setForm((p) => ({
          ...p,
          catalogItems: typeof updater === 'function' ? updater(p.catalogItems || []) : updater
        }));
      }}
      schema={schema}
      heading={stepTitle || 'Packages & Blocks'}
      helper={`Add every package / type under ${categoryTitle}. Later you can add more packages without re-filling business details.`}
      showApprovalNote
      minItems={1}
    />
  );
};

// ════════════════════════════════════════════════════════════════
// STEP 5: AVAILABILITY
// ════════════════════════════════════════════════════════════════
const StepAvailability = ({ form, setForm }) => {
  const toggleDay = (day) => {
    setForm(p => ({
      ...p, availability: {
        ...p.availability,
        workingDays: {
          ...p.availability.workingDays,
          [day]: { ...p.availability.workingDays[day], isOpen: !p.availability.workingDays[day]?.isOpen }
        }
      }
    }));
  };
  const updateShift = (day, field, value) => {
    setForm(p => {
      const shifts = p.availability.workingDays[day]?.shifts || [{ start: '09:00', end: '18:00' }];
      shifts[0] = { ...shifts[0], [field]: value };
      return {
        ...p, availability: {
          ...p.availability,
          workingDays: { ...p.availability.workingDays, [day]: { ...p.availability.workingDays[day], shifts } }
        }
      };
    });
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Working Days & Hours" icon="📅">
        <div className="space-y-2">
          {DAYS.map(day => {
            const dayData = form.availability.workingDays[day] || { isOpen: false, shifts: [{ start: '09:00', end: '18:00' }] };
            return (
              <div key={day} className={`flex items-center gap-3 p-2.5 rounded-xl border ${dayData.isOpen ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100'}`}>
                <button type="button" onClick={() => toggleDay(day)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${dayData.isOpen ? 'bg-primary-500 border-primary-500' : 'bg-white border-slate-300'}`}>
                  {dayData.isOpen && <FiCheck className="w-3 h-3 text-white" />}
                </button>
                <span className={`text-xs font-bold w-10 ${dayData.isOpen ? 'text-slate-800' : 'text-slate-400'}`}>{DAY_LABELS[day]}</span>
                {dayData.isOpen && (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input type="time" value={dayData.shifts?.[0]?.start || '09:00'} onChange={e => updateShift(day, 'start', e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-blue-400 outline-none" />
                    <span className="text-[10px] text-slate-400">to</span>
                    <input type="time" value={dayData.shifts?.[0]?.end || '18:00'} onChange={e => updateShift(day, 'end', e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-blue-400 outline-none" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// STEP 6: SERVICE AREA
// ════════════════════════════════════════════════════════════════
const StepServiceArea = ({ form, updateNested }) => (
  <div className="space-y-4">
    <SectionCard title="Service Area" icon="📍">
      <FormInput label="City" value={form.serviceArea.city} onChange={v => updateNested('serviceArea', 'city', v)} placeholder="e.g. Jaipur" />
      <div>
        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Areas Served</label>
        <input type="text" value={(form.serviceArea.areas || []).join(', ')} onChange={e => updateNested('serviceArea', 'areas', e.target.value.split(',').map(a => a.trim()).filter(Boolean))}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-primary-400 outline-none"
          placeholder="Malviya Nagar, C-Scheme, Mansarovar" />
        <p className="text-[10px] text-slate-400 mt-1">Separate areas with commas</p>
      </div>
      <div>
        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Pincodes</label>
        <input type="text" value={(form.serviceArea.pincodes || []).join(', ')} onChange={e => updateNested('serviceArea', 'pincodes', e.target.value.split(',').map(p => p.trim()).filter(Boolean))}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-primary-400 outline-none"
          placeholder="302017, 302020, 302021" />
      </div>
      <FormInput label="Service Radius (KM)" type="number" value={form.serviceArea.radiusKm} onChange={v => updateNested('serviceArea', 'radiusKm', Number(v) || 10)} placeholder="10" />
    </SectionCard>
  </div>
);

// ════════════════════════════════════════════════════════════════
// STEP 7: DOCUMENTS & PORTFOLIO
// ════════════════════════════════════════════════════════════════
const StepDocuments = ({ form, setForm }) => {
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setForm(p => ({ ...p, portfolioPhotos: [...p.portfolioPhotos, reader.result] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx) => {
    setForm(p => ({ ...p, portfolioPhotos: p.portfolioPhotos.filter((_, i) => i !== idx) }));
  };

  const handleDocUpload = (e, label) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm(p => ({ ...p, documents: [...p.documents, { label: label || file.name, url: reader.result, type: 'certificate' }] }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Service Showing Photos" icon="📸">
        <p className="text-[10px] text-slate-500 mb-2">Upload photos showcasing your service (max 10)</p>
        <div className="grid grid-cols-3 gap-2">
          {form.portfolioPhotos.map((photo, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
              <img src={photo} alt="" className="w-full h-full object-cover" />
              <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">✕</button>
            </div>
          ))}
          {form.portfolioPhotos.length < 10 && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
              <FiImage className="w-5 h-5 text-slate-400 mb-1" />
              <span className="text-[10px] font-bold text-slate-400">Add Photo</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
            </label>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Certificates & Documents" icon="📄">
        <p className="text-[10px] text-slate-500 mb-2">Upload relevant certificates, licenses, or registrations</p>
        {form.documents.map((doc, i) => (
          <div key={i} className="flex items-center gap-2 py-2 px-3 bg-emerald-50 rounded-xl border border-emerald-200 mb-2">
            <FiCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-emerald-800 flex-1 truncate">{doc.label}</span>
            <button onClick={() => setForm(p => ({ ...p, documents: p.documents.filter((_, idx) => idx !== i) }))}
              className="text-red-400 hover:text-red-600 text-xs">Remove</button>
          </div>
        ))}
        <label className="flex items-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 cursor-pointer hover:border-blue-400 transition-colors">
          <FiFileText className="w-5 h-5 text-slate-400" />
          <span className="text-xs font-bold text-slate-500">Upload Certificate / Document</span>
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocUpload(e, 'Certificate')} />
        </label>
      </SectionCard>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// STEP 8: BOOKING CONFIG
// ════════════════════════════════════════════════════════════════
const StepBookingConfig = ({ form, updateForm, updateNested, category }) => {
  const options = listingModeOptions(category?.bookingMode);
  return (
  <div className="space-y-4">
    <SectionCard title="Booking Mode" icon="📱">
      <p className="text-[10px] text-slate-500 mb-2">
        Admin allows: {category?.bookingMode || 'BOTH'} for this service
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map(([val, label]) => (
          <button key={val} type="button" onClick={() => updateForm('bookingMode', val)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
              form.bookingMode === val ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-slate-600 border-slate-200'
            }`}>
            {label}
          </button>
        ))}
      </div>
    </SectionCard>

    <SectionCard title="Cancellation Policy" icon="🚫">
      <ToggleRow label="Allow Cancellation" value={form.cancellation.cancellationAllowed} onChange={v => updateNested('cancellation', 'cancellationAllowed', v)} />
      {form.cancellation.cancellationAllowed && (
        <div className="grid grid-cols-2 gap-3 mt-2">
          <FormInput label="Cancel Window (Hours)" type="number" value={form.cancellation.cancellationWindowHours} onChange={v => updateNested('cancellation', 'cancellationWindowHours', Number(v))} />
          <FormInput label="Cancel Fee (%)" type="number" value={form.cancellation.cancellationFeePercent} onChange={v => updateNested('cancellation', 'cancellationFeePercent', Number(v))} />
        </div>
      )}
      <ToggleRow label="Allow Rescheduling" value={form.cancellation.reschedulingAllowed} onChange={v => updateNested('cancellation', 'reschedulingAllowed', v)} />
    </SectionCard>

    <SectionCard title="Advance Booking" icon="⏰">
      <div className="grid grid-cols-2 gap-3">
        <FormInput label="Min Advance (Minutes)" type="number" value={form.bookingConfig.minAdvanceBookingMinutes} onChange={v => updateNested('bookingConfig', 'minAdvanceBookingMinutes', Number(v))} />
        <FormInput label="Max Advance (Days)" type="number" value={form.bookingConfig.maxAdvanceBookingDays} onChange={v => updateNested('bookingConfig', 'maxAdvanceBookingDays', Number(v))} />
      </div>
    </SectionCard>
  </div>
  );
};

// ════════════════════════════════════════════════════════════════
// STEP 9: PREVIEW
// ════════════════════════════════════════════════════════════════
const StepPreview = ({ form, category }) => {
  const title = extractListingTitle(form.dynamicFormAnswers, form.catalogItems) || 'Untitled';
  const menuPrices = (form.catalogItems || []).map((i) => Number(i.price) || 0).filter((p) => p > 0);
  const fromPrice = menuPrices.length ? Math.min(...menuPrices) : null;

  const renderAnswers = (answers, schema, cardTitle) => {
    if (!answers || !Object.keys(answers).length) return null;
    return (
      <SectionCard title={cardTitle} icon="📋">
        <div className="space-y-1.5">
          {(schema || []).length > 0
            ? schema.map((field) => {
              const v = answers[field.key];
              if (v === undefined || v === null || v === '') return null;
              return (
                <div key={field.key} className="flex items-start gap-2 py-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase w-28 shrink-0">{field.label}</span>
                  <span className="text-xs font-medium text-slate-800">{Array.isArray(v) ? v.join(', ') : String(v)}</span>
                </div>
              );
            })
            : Object.entries(answers).map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 py-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase w-28 shrink-0">{key}</span>
                <span className="text-xs font-medium text-slate-800">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
              </div>
            ))}
        </div>
      </SectionCard>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-2xl p-4 border border-primary-100">
        <div className="flex items-start gap-3">
          {category?.iconUrl && <img src={category.iconUrl} alt="" className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-primary-100" />}
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-black text-primary-600 uppercase tracking-wider">{category?.title}</span>
            <h3 className="text-base font-black text-slate-900 mt-0.5">{title}</h3>
            {fromPrice !== null && <p className="text-xs font-bold text-slate-700 mt-1">From ₹{fromPrice}</p>}
          </div>
        </div>
      </div>

      {renderAnswers(form.dynamicFormAnswers, category?.vendorFormSchema, 'Service Details')}
      {renderAnswers(form.pricingFormAnswers, category?.pricingFormSchema, 'Pricing')}
      {renderAnswers(form.availabilityFormAnswers, category?.availabilityFormSchema, 'Availability')}
      {renderAnswers(form.serviceAreaFormAnswers, category?.serviceAreaFormSchema, 'Service Area')}
      {renderAnswers(form.bookingRulesFormAnswers, category?.bookingRulesFormSchema, 'Booking Rules')}

      {form.catalogItems?.length > 0 && (
        <SectionCard title={`Packages (${form.catalogItems.length})`} icon="Layers">
          <div className="space-y-2">
            {form.catalogItems.map((item, index) => (
              <div key={item.id || index} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                {item.photoUrl && <img src={item.photoUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0 flex justify-between">
                  <h4 className="text-xs font-bold text-slate-800 truncate">{item.title || `Package ${index + 1}`}</h4>
                  <span className="text-xs font-black text-slate-900 ml-2">₹{item.price || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
        <p className="text-[11px] font-semibold text-amber-900">
          Submit sends this to admin. New listings and package updates go live for customers only after approval.
        </p>
      </div>

      {form.portfolioPhotos?.length > 0 && (
        <SectionCard title="Photos" icon="📸">
          <div className="flex gap-2 overflow-x-auto">
            {form.portfolioPhotos.map((p, i) => (
              <img key={i} src={p} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0" />
            ))}
          </div>
        </SectionCard>
      )}

      <div className="bg-primary-50 rounded-xl p-3.5 border border-primary-200">
        <div className="flex items-start gap-2">
          <FiAlertCircle className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-xs font-black text-primary-800">Ready to Submit?</h4>
            <p className="text-[10px] text-primary-700 mt-0.5">Admin will review before your listing goes live.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ════════════════════════════════════════════════════════════════
const SectionCard = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
      <span>{icon}</span> {title}
    </h3>
    {children}
  </div>
);

const ToggleRow = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className="text-xs font-bold text-slate-700">{label}</span>
    <button type="button" onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-all relative ${value ? 'bg-primary-600' : 'bg-slate-300'}`}>
      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${value ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  </div>
);

const InfoChip = ({ label, value }) => (
  <div className="bg-white rounded-lg p-2 text-center border border-slate-100">
    <p className="text-[9px] font-bold text-slate-400 uppercase">{label}</p>
    <p className="text-xs font-black text-slate-800 mt-0.5">{value}</p>
  </div>
);

export default AddService;
