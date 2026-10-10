import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FiArrowLeft, FiCheck, FiChevronRight, FiChevronLeft, FiSave, FiSend,
  FiInfo, FiFileText, FiClock, FiMapPin, FiImage, FiEye,
  FiAlertCircle, FiLoader, FiLayers, FiPlus, FiTrash2, FiTag, FiPhone, FiShoppingBag, FiCamera
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';
import DynamicField, { FormInput, FormTextarea, DynamicFormFields } from '../../components/common/DynamicField';
import VendorLocationPicker from '../../components/common/VendorLocationPicker';
import {
  buildListingSteps,
  validateDynamicSchema,
  extractListingTitle
} from '../../utils/listingFormConfig';

const emptyCatalogItem = () => ({
  id: crypto.randomUUID(),
  title: '',
  description: '',
  price: '',
  photoUrl: null,
  isActive: true
});

const EMPTY_FORM = {
  categoryId: '',
  title: '',
  description: '',
  shortDescription: '',
  phone: '',
  whatsapp: '',
  address: '',
  landmark: '',
  city: 'Indore',
  pincode: '',
  lat: null,
  lng: null,
  operatingHours: '10:00 AM - 9:30 PM',
  bannerPhoto: null,
  frontPhoto: null,
  offer: {
    title: '',
    discountTag: '',
    description: '',
    isActive: true
  },
  portfolioPhotos: [],
  catalogItems: [emptyCatalogItem()],
  dynamicFormAnswers: {},
  pricingFormAnswers: {},
  availabilityFormAnswers: {},
  serviceAreaFormAnswers: {},
  bookingRulesFormAnswers: {},
  documentsFormAnswers: {},
  listingFormAnswers: {},
  documents: [],
  bookingMode: 'BOTH'
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
            const dyn = s.dynamicFormAnswers || {};
            const photos = s.portfolioPhotos || [];
            setForm({
              categoryId: s.categoryId?._id || s.categoryId || '',
              title: s.title || dyn.shopName || dyn.boutiqueName || '',
              description: s.description || dyn.description || dyn.about || '',
              shortDescription: s.shortDescription || dyn.shortDescription || dyn.tagline || '',
              phone: dyn.phone || '',
              whatsapp: dyn.whatsapp || '',
              address: dyn.address || s.serviceArea?.areas?.[0] || '',
              landmark: dyn.landmark || s.serviceArea?.areas?.[1] || '',
              city: dyn.city || s.serviceArea?.city || 'Indore',
              pincode: dyn.pincode || s.serviceArea?.pincodes?.[0] || '',
              operatingHours: dyn.operatingHours || s.availability?.operatingHours || '10:00 AM - 9:30 PM',
              bannerPhoto: photos[0] || null,
              frontPhoto: photos[1] || null,
              portfolioPhotos: photos.length > 2 ? photos.slice(2) : [],
              offer: dyn.offer || { title: '', discountTag: '', description: '', isActive: true },
              catalogItems: s.catalogItems?.length ? s.catalogItems : [emptyCatalogItem()],
              dynamicFormAnswers: dyn,
              pricingFormAnswers: s.pricingFormAnswers || {},
              availabilityFormAnswers: s.availabilityFormAnswers || {},
              serviceAreaFormAnswers: s.serviceAreaFormAnswers || {},
              bookingRulesFormAnswers: s.bookingRulesFormAnswers || {},
              documentsFormAnswers: s.documentsFormAnswers || {},
              listingFormAnswers: s.listingFormAnswers || {},
              documents: s.documents || [],
              bookingMode: 'BOTH'
            });
          }
        }
      } catch (err) {
        toast.error('Failed to load listing information');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [categorySlug, serviceId]);

  // ─── FORM HELPERS ───
  const updateForm = (key, value) => setForm(p => ({ ...p, [key]: value }));
  const updateOffer = (key, value) => setForm(p => ({ ...p, offer: { ...p.offer, [key]: value } }));
  const selectCategory = (cat) => {
    const catId = cat.id || cat._id;
    setForm(p => ({
      ...p,
      categoryId: catId,
      dynamicFormAnswers: p.categoryId === catId ? p.dynamicFormAnswers : {},
      catalogItems: p.catalogItems?.length ? p.catalogItems : [emptyCatalogItem()]
    }));
  };
  const updateDynamic = (key, value) => setForm(p => ({
    ...p,
    dynamicFormAnswers: { ...p.dynamicFormAnswers, [key]: value }
  }));
  const toggleDynamicMulti = (key, value) => {
    setForm(p => {
      const current = Array.isArray(p.dynamicFormAnswers[key]) ? p.dynamicFormAnswers[key] : [];
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...p, dynamicFormAnswers: { ...p.dynamicFormAnswers, [key]: updated } };
    });
  };

  // ─── NAVIGATION & VALIDATION ───
  const canGoNext = () => {
    if (!currentStep) return false;
    if (currentStep.key === 'category') return Boolean(form.categoryId);
    if (currentStep.key === 'details') {
      const title = form.title || form.dynamicFormAnswers.shopName || form.dynamicFormAnswers.boutiqueName;
      return Boolean(title && title.trim().length > 1);
    }
    if (currentStep.key === 'products') {
      return form.catalogItems.some(item => (item.title || '').trim().length > 0);
    }
    return true;
  };

  const goNext = () => {
    if (!canGoNext()) {
      if (currentStep.key === 'category') {
        toast.error('Kripya apni dukaan ki category chuniye');
      } else if (currentStep.key === 'details') {
        toast.error('Dukaan / Store ka naam likhna zaroori hai');
      } else if (currentStep.key === 'products') {
        toast.error('Kam se kam ek kapda / design / product add karein');
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
      const resolvedTitle = String(
        form.title ||
        form.dynamicFormAnswers.shopName ||
        form.dynamicFormAnswers.boutiqueName ||
        extractListingTitle(form.dynamicFormAnswers, form.catalogItems) ||
        'Apna Store'
      ).trim();

      // Collect all photos in order: Banner -> Front -> Gallery
      const allPhotos = [
        ...(form.bannerPhoto ? [form.bannerPhoto] : []),
        ...(form.frontPhoto ? [form.frontPhoto] : []),
        ...(form.portfolioPhotos || [])
      ].filter(Boolean);

      const payload = {
        categoryId: form.categoryId,
        title: resolvedTitle,
        description: form.description || form.dynamicFormAnswers.description || '',
        shortDescription: form.shortDescription || form.dynamicFormAnswers.shortDescription || '',
        serviceArea: {
          city: form.city || 'Indore',
          areas: [form.address, form.landmark].filter(Boolean),
          pincodes: form.pincode ? [form.pincode] : []
        },
        address: {
          fullAddress: form.address,
          landmark: form.landmark,
          city: form.city || 'Indore',
          pincode: form.pincode,
          lat: form.lat != null ? Number(form.lat) : undefined,
          lng: form.lng != null ? Number(form.lng) : undefined
        },
        location: (form.lat != null && form.lng != null) ? {
          type: 'Point',
          coordinates: [Number(form.lng), Number(form.lat)]
        } : undefined,
        availability: {
          workingDays: form.availabilityFormAnswers?.workingDays || {},
          operatingHours: form.operatingHours || '10:00 AM - 9:30 PM'
        },
        dynamicFormAnswers: {
          ...form.dynamicFormAnswers,
          shopName: resolvedTitle,
          boutiqueName: resolvedTitle,
          tagline: form.shortDescription,
          about: form.description,
          phone: form.phone,
          whatsapp: form.whatsapp,
          address: form.address,
          landmark: form.landmark,
          city: form.city || 'Indore',
          pincode: form.pincode,
          operatingHours: form.operatingHours,
          offer: form.offer?.title?.trim() ? {
            title: form.offer.title.trim(),
            discountTag: form.offer.discountTag?.trim() || 'SPECIAL OFFER',
            description: form.offer.description?.trim() || '',
            isActive: form.offer.isActive !== false
          } : null
        },
        portfolioPhotos: allPhotos,
        catalogItems: form.catalogItems.filter(item => (item.title || '').trim().length > 0),
        bookingMode: 'BOTH',
        isDraft
      };

      let res;
      if (isEdit) {
        res = await api.patch(`/vendors/services/${serviceId}`, payload);
      } else {
        res = await api.post('/vendors/services', payload);
      }

      // Also create marketing offer if provided
      if (form.offer?.title?.trim() && !isDraft) {
        try {
          await api.post('/vendors/marketing/offers', {
            title: form.offer.title.trim(),
            discountBadge: form.offer.discountTag?.trim() || 'SPECIAL OFFER',
            terms: form.offer.description?.trim() || '',
            imageUrl: form.bannerPhoto || form.frontPhoto || ''
          });
        } catch (offerErr) {
          console.warn('Auto offer creation handled by listing fallback:', offerErr);
        }
      }

      if (res.data?.success) {
        const msg = isDraft
          ? 'Draft successfully saved!'
          : 'Dukaan advertisement approval ke liye submit ho gayi hai! Admin verify karte hi live ho jayegi.';
        toast.success(res.data.message || msg);
        navigate('/vendor/my-services');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Dukaan save karne me samasya aayi');
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
          <p className="text-sm text-slate-500 font-bold">Dukaan jankari load ho rahi hai...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => step > 0 ? goBack() : navigate(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 active:scale-95">
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-slate-900 truncate">
              {isEdit ? 'Dukaan Listing Edit Karein' : 'Dukaan Listing & Advertisement'}
            </h1>
            {selectedCategory && (
              <p className="text-[10px] font-bold text-primary-600 truncate">
                Category: {selectedCategory.title}
              </p>
            )}
          </div>
          <span className="text-xs font-black text-primary-700 bg-primary-50 px-2 py-1 rounded-full">
            {step + 1} / {steps.length}
          </span>
        </div>

        <div className="mt-3 flex gap-1">
          {steps.map((s, i) => (
            <div key={s.key + i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < step ? 'bg-primary-600' : i === step ? 'bg-primary-500' : 'bg-slate-200'}`} />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          {currentStep?.icon && React.createElement(currentStep.icon, { className: 'w-4 h-4 text-primary-600' })}
          <span className="text-xs font-black text-slate-800">{currentStep?.label}</span>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {/* Step 0: Category */}
        {currentStep?.key === 'category' && (
          <StepCategory categories={categories} form={form} onSelectCategory={selectCategory} />
        )}

        {/* Step 1: Details & Location */}
        {currentStep?.key === 'details' && (
          <StepDetails
            form={form}
            updateForm={updateForm}
            updateDynamic={updateDynamic}
            toggleDynamicMulti={toggleDynamicMulti}
            category={selectedCategory}
          />
        )}

        {/* Step 2: Photos & Advertisement */}
        {currentStep?.key === 'photos' && (
          <StepPhotos form={form} setForm={setForm} />
        )}

        {/* Step 3: Special Offers */}
        {currentStep?.key === 'offers' && (
          <StepOffers form={form} updateOffer={updateOffer} />
        )}

        {/* Step 4: Designs & Clothes */}
        {currentStep?.key === 'products' && (
          <StepProducts form={form} setForm={setForm} category={selectedCategory} />
        )}

        {/* Step 5: Preview & Publish */}
        {currentStep?.key === 'preview' && (
          <StepPreview form={form} category={selectedCategory} />
        )}
      </main>

      {/* Bottom Fixed Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-30 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {step > 0 && (
            <button onClick={goBack} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all">
              <FiChevronLeft className="w-4 h-4" /> Peeche
            </button>
          )}
          <div className="flex-1" />

          {step < steps.length - 1 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={submitting || !form.categoryId}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40"
              >
                <FiSave className="w-3.5 h-3.5 inline mr-1" /> Draft Save
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext()}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-40 shadow-sm"
              >
                Aage Badhein <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40"
              >
                <FiSave className="w-3.5 h-3.5 inline mr-1" /> Draft Save
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={submitting || !form.categoryId}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-40 shadow-md"
              >
                {submitting ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
                {submitting ? 'Submit ho raha hai...' : 'Dukaan Publish Karein'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// STEP 0: CATEGORY SELECTION (Clean Shop Categories, NO booking mode)
// ════════════════════════════════════════════════════════════════
const StepCategory = ({ categories, form, onSelectCategory }) => (
  <div className="space-y-4">
    <div className="bg-primary-50 rounded-2xl p-4 border border-primary-100">
      <div className="flex items-center gap-2">
        <FiShoppingBag className="w-5 h-5 text-primary-700" />
        <h3 className="text-sm font-black text-primary-900">Apni Dukaan ki Category Chuniye</h3>
      </div>
      <p className="text-xs text-primary-700 mt-1 leading-relaxed">
        Aapki dukaan kis cheez ki hai? Category chunne ke baad aap dukan ki photos, special offers, location aur cloths/products list kar sakenge.
      </p>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {categories.map(cat => {
        const catId = cat.id || cat._id;
        const isSelected = form.categoryId === catId;
        const hasListing = cat.existingListing;
        return (
          <button
            key={catId}
            type="button"
            onClick={() => !hasListing && onSelectCategory(cat)}
            disabled={!!hasListing}
            className={`relative p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97] flex flex-col justify-between min-h-[110px] ${
              isSelected
                ? 'border-primary-600 bg-primary-50 shadow-md ring-2 ring-primary-200'
                : hasListing
                ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                : 'border-slate-200 bg-white hover:border-primary-400 hover:shadow-sm'
            }`}
          >
            {isSelected && (
              <div className="absolute top-2.5 right-2.5 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center shadow-sm">
                <FiCheck className="w-3.5 h-3.5 text-white stroke-[3]" />
              </div>
            )}
            <div>
              {cat.iconUrl ? (
                <img src={cat.iconUrl} alt="" className="w-10 h-10 rounded-xl mb-2 object-cover bg-white shadow-xs border border-slate-100" />
              ) : (
                <div className="w-10 h-10 rounded-xl mb-2 bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                  🏬
                </div>
              )}
              <h4 className={`text-xs font-black ${isSelected ? 'text-primary-950' : 'text-slate-900'}`}>
                {cat.title}
              </h4>
            </div>
            {cat.subtitle && (
              <p className="text-[10px] text-slate-500 mt-1 font-medium">{cat.subtitle}</p>
            )}
            {hasListing && (
              <span className="text-[9px] font-bold text-amber-600 mt-1">Already Added</span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════
// STEP 1: SHOP DETAILS & LOCATION
// ════════════════════════════════════════════════════════════════
const StepDetails = ({ form, updateForm, updateDynamic, toggleDynamicMulti, category }) => {
  const vendorSchema = category?.vendorFormSchema || [];

  return (
    <div className="space-y-4">
      {/* Basic Shop Information */}
      <SectionCard title="Dukaan ki Jankari (Basic Info)" icon="🏬">
        <FormInput
          label="Dukaan / Store Name *"
          value={form.title}
          onChange={v => updateForm('title', v)}
          placeholder="e.g. Rajesh Sarees & Boutique / Mahalaxmi Cloth Store"
        />
        <FormInput
          label="Advertisement Tagline / Punchline"
          value={form.shortDescription}
          onChange={v => updateForm('shortDescription', v)}
          placeholder="e.g. Best Designer Sarees, Lehengas & Kurtis at Wholesale Rates"
        />
        <FormTextarea
          label="About Your Shop / Description"
          value={form.description}
          onChange={v => updateForm('description', v)}
          placeholder="Apni dukaan ke baare mein likhein (jaise 10 saal se trusted dukaan, custom fitting, bridal collection, etc.)..."
          rows={3}
        />
      </SectionCard>

      {/* Dynamic Category Specific Details (e.g. Clothing options, trial room, price segment) */}
      {vendorSchema.length > 0 && (
        <SectionCard title={`${category?.title || 'Shop'} Specific Details`} icon="✨">
          <p className="text-[11px] text-slate-500 mb-2">
            Ye details customers ko aapki dukaan discover karne me madad karegi:
          </p>
          <DynamicFormFields
            schema={vendorSchema}
            values={form.dynamicFormAnswers}
            onChange={updateDynamic}
            onToggleMulti={toggleDynamicMulti}
          />
        </SectionCard>
      )}

      {/* Address & Location */}
      <SectionCard title="Dukaan ka Pata & Location (Address)" icon="📍">
        <div className="mb-3">
          <VendorLocationPicker
            initialPosition={form.lat && form.lng ? { lat: form.lat, lng: form.lng } : null}
            onLocationSelect={(loc) => {
              if (loc.fullAddress) updateForm('address', loc.fullAddress);
              if (loc.city) updateForm('city', loc.city);
              if (loc.pincode) updateForm('pincode', loc.pincode);
              if (loc.landmark) updateForm('landmark', loc.landmark);
              if (loc.lat) updateForm('lat', loc.lat);
              if (loc.lng) updateForm('lng', loc.lng);
            }}
            placeholder="Search shop location, market, or landmark..."
          />
        </div>

        <FormInput
          label="Full Address & Shop No. *"
          value={form.address}
          onChange={v => updateForm('address', v)}
          placeholder="e.g. Shop No. 12, First Floor, Sarafa Market, Near Rajwada"
        />
        <FormInput
          label="Landmark (Prasiddh Sthan)"
          value={form.landmark}
          onChange={v => updateForm('landmark', v)}
          placeholder="e.g. Opposite State Bank of India"
        />
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="City"
            value={form.city}
            onChange={v => updateForm('city', v)}
            placeholder="Indore"
          />
          <FormInput
            label="Pincode"
            value={form.pincode}
            onChange={v => updateForm('pincode', v)}
            placeholder="452001"
          />
        </div>
      </SectionCard>

      {/* Contact & Hours */}
      <SectionCard title="Sampark & Timings (Contact & Hours)" icon="📞">
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Calling Number"
            value={form.phone}
            onChange={v => updateForm('phone', v)}
            placeholder="e.g. 9876543210"
          />
          <FormInput
            label="WhatsApp Number"
            value={form.whatsapp}
            onChange={v => updateForm('whatsapp', v)}
            placeholder="e.g. 9876543210"
          />
        </div>
        <FormInput
          label="Daily Operating Timings"
          value={form.operatingHours}
          onChange={v => updateForm('operatingHours', v)}
          placeholder="e.g. 10:30 AM - 9:30 PM (All 7 Days Open)"
        />
      </SectionCard>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// STEP 2: PHOTOS & ADVERTISEMENT BANNERS
// ════════════════════════════════════════════════════════════════
const StepPhotos = ({ form, setForm }) => {
  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(p => ({ ...p, bannerPhoto: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleFrontUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(p => ({ ...p, frontPhoto: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setForm(p => ({
          ...p,
          portfolioPhotos: [...(p.portfolioPhotos || []), reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryPhoto = (index) => {
    setForm(p => ({
      ...p,
      portfolioPhotos: p.portfolioPhotos.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-4">
      {/* Main Cover Banner */}
      <SectionCard title="Dukaan ka Main Advertisement Banner (Cover Photo)" icon="🖼️">
        <p className="text-[11px] text-slate-500">
          Ye banner aapki dukaan ke profile aur Apna Market home screen pe sabse upar dikhega.
        </p>
        {form.bannerPhoto ? (
          <div className="relative aspect-[16/8] rounded-2xl overflow-hidden border border-slate-200 group">
            <img src={form.bannerPhoto} alt="Cover Banner" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, bannerPhoto: null }))}
              className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <label className="aspect-[16/8] rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50/40 hover:bg-primary-50 flex flex-col items-center justify-center cursor-pointer transition-all">
            <FiCamera className="w-8 h-8 text-primary-600 mb-1" />
            <span className="text-xs font-bold text-primary-800">Main Banner Photo Upload Karein</span>
            <span className="text-[10px] text-slate-400 mt-0.5">High resolution wide photo (16:9)</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          </label>
        )}
      </SectionCard>

      {/* Shop Front Photo */}
      <SectionCard title="Dukaan ke Samne ki Photo (Shop Board / Entrance)" icon="🏬">
        <p className="text-[11px] text-slate-500">
          Dukaan ke bahar aur board ki photo taaki customer dukaan aasani se pehchan sakein.
        </p>
        {form.frontPhoto ? (
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200">
            <img src={form.frontPhoto} alt="Shop Front" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, frontPhoto: null }))}
              className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <label className="aspect-[16/9] rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center cursor-pointer transition-all">
            <FiImage className="w-7 h-7 text-slate-400 mb-1" />
            <span className="text-xs font-bold text-slate-700">Dukaan Board / Entrance Photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFrontUpload} />
          </label>
        )}
      </SectionCard>

      {/* Gallery Photos */}
      <SectionCard title="Dukaan ke Andar ki Photos (Cloth Racks / Display / Ambience)" icon="📸">
        <p className="text-[11px] text-slate-500 mb-2">
          Dukaan ke displays, kapdo ke racks, counters ki photos add karein (Max 10).
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {(form.portfolioPhotos || []).map((photo, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
              <img src={photo} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeGalleryPhoto(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs"
              >
                ✕
              </button>
            </div>
          ))}

          {(form.portfolioPhotos || []).length < 10 && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 bg-white hover:border-primary-400 flex flex-col items-center justify-center cursor-pointer transition-all">
              <FiPlus className="w-6 h-6 text-slate-400 mb-0.5" />
              <span className="text-[10px] font-bold text-slate-500">+ Photo</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
            </label>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// STEP 3: SPECIAL OFFERS & DISCOUNTS
// ════════════════════════════════════════════════════════════════
const StepOffers = ({ form, updateOffer }) => {
  const offer = form.offer || {};

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
        <div className="flex items-center gap-2">
          <FiTag className="w-5 h-5 text-amber-700" />
          <h3 className="text-sm font-black text-amber-900">Dukaan ke Special Offers & Discounts</h3>
        </div>
        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
          Apni dukaan par chal rahe festive discounts, season sale ya special deals yahan daalein. Customers ko ye offer card sabse pehle dikhega!
        </p>
      </div>

      <SectionCard title="Active Promotional Offer" icon="🎁">
        <div className="space-y-3">
          <FormInput
            label="Offer Headline / Name"
            value={offer.title || ''}
            onChange={v => updateOffer('title', v)}
            placeholder="e.g. Flat 25% Off on Wedding Sarees / Buy 2 Get 1 Free on Shirts"
          />

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Discount Tag (Badge)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['20% OFF', '25% OFF', '50% OFF', 'BUY 1 GET 1', 'FLAT ₹500 OFF', 'FESTIVE SALE'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => updateOffer('discountTag', tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    offer.discountTag === tag
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <FormInput
              label="Custom Tag"
              value={offer.discountTag || ''}
              onChange={v => updateOffer('discountTag', v)}
              placeholder="e.g. SPECIAL 30% OFF"
            />
          </div>

          <FormTextarea
            label="Offer Details & Terms"
            value={offer.description || ''}
            onChange={v => updateOffer('description', v)}
            placeholder="e.g. Valid on all bridal sarees & lehengas above ₹1,999 purchase. In-store walk-in offer."
            rows={2}
          />

          {offer.title && (
            <div className="mt-4 p-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-md">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                {offer.discountTag || 'OFFER'}
              </span>
              <h4 className="text-sm font-black mt-1">{offer.title}</h4>
              {offer.description && (
                <p className="text-[11px] text-white/90 mt-0.5">{offer.description}</p>
              )}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// STEP 4: DESIGNS, CLOTHES & PRODUCTS SHOWCASE
// ════════════════════════════════════════════════════════════════
const StepProducts = ({ form, setForm, category }) => {
  const items = form.catalogItems || [];

  const addItem = () => {
    setForm(p => ({
      ...p,
      catalogItems: [...(p.catalogItems || []), emptyCatalogItem()]
    }));
  };

  const updateItem = (index, field, value) => {
    setForm(p => {
      const next = [...(p.catalogItems || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...p, catalogItems: next };
    });
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setForm(p => ({
      ...p,
      catalogItems: p.catalogItems.filter((_, i) => i !== index)
    }));
  };

  const handleItemPhoto = (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateItem(index, 'photoUrl', reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="bg-primary-50 rounded-2xl p-4 border border-primary-100">
        <h3 className="text-sm font-black text-primary-900">Designs, Clothes & Products Showcase</h3>
        <p className="text-xs text-primary-700 mt-1 leading-relaxed">
          Aapki dukaan ke main designs, kapde, ya items list karein taaki customers photos aur daam (price) dekh sakein.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={item.id || idx} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-primary-800 bg-primary-50 px-2.5 py-1 rounded-full">
                Item #{idx + 1}
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {/* Photo uploader */}
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-primary-400 flex flex-col items-center justify-center shrink-0 cursor-pointer overflow-hidden transition-all">
                {item.photoUrl ? (
                  <img src={item.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <FiCamera className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-[9px] font-bold text-slate-500">+ Photo</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleItemPhoto(e, idx)} />
              </label>

              {/* Item details */}
              <div className="flex-1 space-y-2">
                <FormInput
                  label="Design / Cloth / Item Name *"
                  value={item.title}
                  onChange={v => updateItem(idx, 'title', v)}
                  placeholder="e.g. Banarasi Silk Saree / Designer Kurti / Linen Shirt"
                />
                <FormInput
                  label="Price (₹) / Daam"
                  type="number"
                  value={item.price}
                  onChange={v => updateItem(idx, 'price', v)}
                  placeholder="e.g. 1499"
                />
              </div>
            </div>

            <FormInput
              label="Fabric / Features / Description"
              value={item.description}
              onChange={v => updateItem(idx, 'description', v)}
              placeholder="e.g. Pure Georgette fabric, embroidered golden zari work, red & green colors"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="w-full py-3.5 rounded-2xl border-2 border-dashed border-primary-400 bg-primary-50/50 text-primary-700 font-black text-xs flex items-center justify-center gap-2 hover:bg-primary-50 active:scale-[0.99] transition-all"
      >
        <FiPlus className="w-4 h-4" /> + Aur Design / Cloth Add Karein
      </button>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// STEP 5: PREVIEW & PUBLISH
// ════════════════════════════════════════════════════════════════
const StepPreview = ({ form, category }) => {
  const title = form.title || form.dynamicFormAnswers.shopName || form.dynamicFormAnswers.boutiqueName || 'My Dukaan';
  const coverImage = form.bannerPhoto || form.frontPhoto || (form.portfolioPhotos && form.portfolioPhotos[0]) || category?.imageUrl;
  const items = (form.catalogItems || []).filter(i => (i.title || '').trim().length > 0);

  return (
    <div className="space-y-4">
      <div className="bg-primary-600 text-white rounded-2xl p-4 shadow-md">
        <h3 className="text-sm font-black flex items-center gap-1.5">
          <FiEye className="w-4 h-4" /> Dukaan Advertisement Preview
        </h3>
        <p className="text-xs text-white/90 mt-1">
          Aapki dukaan ka advertisement Apna Market pe is tarah dikhega:
        </p>
      </div>

      {/* Realistic Advertisement Card */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-md">
        {/* Cover Banner */}
        <div className="relative aspect-[16/8] bg-slate-100 overflow-hidden">
          {coverImage ? (
            <img src={coverImage} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
              🏬 No Banner Uploaded
            </div>
          )}
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-primary-900 text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-xs">
            {category?.title || 'Shop'}
          </span>
        </div>

        {/* Shop Info */}
        <div className="p-4 space-y-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-1.5">
              {title}
              <span className="w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center text-[10px] text-white">✓</span>
            </h2>
            {form.shortDescription && (
              <p className="text-xs font-semibold text-primary-700 mt-0.5">{form.shortDescription}</p>
            )}
            {form.description && (
              <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{form.description}</p>
            )}
          </div>

          {/* Active Offer Badge */}
          {form.offer?.title && (
            <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase bg-white/20 px-2 py-0.5 rounded-full">
                  {form.offer.discountTag || 'OFFER'}
                </span>
                <p className="text-xs font-black mt-1">{form.offer.title}</p>
              </div>
              <span className="text-lg">🔥</span>
            </div>
          )}

          {/* Address & Timings */}
          <div className="bg-slate-50 rounded-2xl p-3 space-y-1.5 text-xs text-slate-700 border border-slate-100">
            <div className="flex items-start gap-2">
              <FiMapPin className="w-3.5 h-3.5 text-primary-600 mt-0.5 shrink-0" />
              <span>{form.address || 'Address not added'}, {form.city || 'Indore'}</span>
            </div>
            <div className="flex items-center gap-2">
              <FiClock className="w-3.5 h-3.5 text-primary-600 shrink-0" />
              <span>{form.operatingHours || '10:00 AM - 9:30 PM'}</span>
            </div>
            {form.phone && (
              <div className="flex items-center gap-2">
                <FiPhone className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                <span>{form.phone} {form.whatsapp ? `· WhatsApp: ${form.whatsapp}` : ''}</span>
              </div>
            )}
          </div>

          {/* Designs / Clothes Catalog */}
          {items.length > 0 && (
            <div>
              <p className="text-[11px] font-black text-slate-900 uppercase tracking-wide mb-2">
                Designs & Clothes ({items.length})
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {items.map((it, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex gap-2">
                    {it.photoUrl && (
                      <img src={it.photoUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{it.title}</p>
                      {it.price && <p className="text-xs font-black text-primary-700">₹{it.price}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo Gallery preview */}
          {form.portfolioPhotos?.length > 0 && (
            <div>
              <p className="text-[11px] font-black text-slate-900 uppercase tracking-wide mb-2">
                Dukaan Photos ({form.portfolioPhotos.length})
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {form.portfolioPhotos.map((p, i) => (
                  <img key={i} src={p} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
        <FiCheck className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold">Ready to Publish:</span> 'Dukaan Publish Karein' par tap karein. Admin verification ke baad aapki dukaan Apna Market pe live ho jayegi.
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// REUSABLE UI CARD
// ════════════════════════════════════════════════════════════════
const SectionCard = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
      <span>{icon}</span> {title}
    </h3>
    {children}
  </div>
);

export default AddService;
