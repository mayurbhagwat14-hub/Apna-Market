import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiFileText,
  FiArrowRight,
  FiChevronLeft,
  FiCheckCircle,
  FiShield,
  FiBriefcase,
  FiDollarSign,
  FiCreditCard,
  FiMapPin,
  FiLayers,
  FiZap,
  FiDroplet,
  FiWind,
  FiNavigation,
  FiCamera,
  FiHome,
  FiCoffee,
  FiPackage,
  FiKey,
  FiActivity,
  FiCheck,
  FiTool,
  FiCrosshair,
  FiUsers,
  FiMusic,
  FiSun,
  FiMap,
  FiUploadCloud,
  FiSliders,
  FiShoppingBag,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { register, sendOTP as sendVendorOTP } from '../services/authService';
import api from '../../../services/api';
import { publicCatalogService } from '../../../services/catalogService';
import { compressImage } from '../../../utils/imageCompression';
import { useBranding } from '../../../context/BrandingContext';
import { APP_NAME } from '../../../theme/brand';
import {
  AuthShell,
  Button,
  Input,
  OtpInput,
  StepIndicator,
  DocumentUpload,
} from '../../../components/ui';
import VendorLocationPicker from '../components/common/VendorLocationPicker';
import {
  handleAuthFlowError,
  getNetworkAuthMessage,
  isAccountExistsError,
  AUTH_ERROR_CODES,
} from '../../../utils/authErrors';

const profileSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'),
});

const identitySchema = z.object({
  aadhar: z.string().regex(/^\d{12}$/, 'Aadhaar number must be exactly 12 digits'),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g. ABCDE1234F)'),
});

const bankSchema = z.object({
  accountHolderName: z.string().min(2, 'Account holder name is required'),
  accountNumber: z.string().min(8, 'Valid account number is required'),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format (e.g. SBIN0001234)'),
});

const STEPS = ['Details', 'KYC', 'Services & Requirements', 'Bank Details', 'Verify OTP'];

const DEFAULT_MARKET_CATEGORIES = [
  {
    id: 'shops',
    title: 'Shops',
    subtitle: 'All Stores & Kirana',
    imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80',
    badge: 'Retail',
    vendorFormSchema: [
      { key: 'shopName', label: 'Shop / Store Name', type: 'text', required: true, helpText: 'Full trading name of your shop', order: 1 },
      { key: 'storeType', label: 'Store Type', type: 'select', options: ['Kirana / Grocery', 'Supermarket', 'General Store', 'Dairy & Sweets', 'Bakery', 'Organic & Health Food', 'Stationery & Gifts'], required: true, order: 2 },
      { key: 'deliveryAvailable', label: 'Home Delivery Available', type: 'toggle', required: false, order: 3 },
      { key: 'deliveryRadiusKm', label: 'Delivery Radius (in KM)', type: 'number', required: false, helpText: 'Maximum distance you deliver locally', minValue: 1, maxValue: 50, order: 4 },
      { key: 'minimumOrderValue', label: 'Minimum Order Value (₹)', type: 'number', required: false, minValue: 0, order: 5 },
      { key: 'operatingHours', label: 'Daily Operating Hours', type: 'text', required: true, helpText: 'e.g. 8:00 AM - 10:00 PM', order: 6 },
      { key: 'gstNumber', label: 'GST Number (Optional)', type: 'text', required: false, helpText: '15-digit GSTIN if registered', order: 7 }
    ]
  },
  {
    id: 'clothing',
    title: 'Clothing',
    subtitle: 'Fashion & Style',
    imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&auto=format&fit=crop&q=80',
    badge: 'Fashion',
    vendorFormSchema: [
      { key: 'boutiqueName', label: 'Boutique / Store Name', type: 'text', required: true, order: 1 },
      { key: 'clothingCategories', label: 'Apparel Types Sold', type: 'multiselect', options: ["Men's Wear", "Women's Ethnic", "Women's Western", "Kids & Infants", "Bridal & Festive", "Fabrics & Unstitched", "Accessories & Footwear"], required: true, order: 2 },
      { key: 'alterationAvailable', label: 'Alteration / Custom Tailoring Service Available', type: 'toggle', required: false, order: 3 },
      { key: 'trialRoomAvailable', label: 'Trial / Fitting Room Available', type: 'toggle', required: false, order: 4 },
      { key: 'priceRange', label: 'Price Segment', type: 'select', options: ['Budget Friendly (Under ₹999)', 'Mid-Range (₹1,000 - ₹3,500)', 'Premium Designer (₹3,500+)'], required: true, order: 5 },
      { key: 'operatingHours', label: 'Store Timings', type: 'text', required: false, helpText: 'e.g. 11:00 AM - 9:30 PM', order: 6 }
    ]
  },
  {
    id: 'restaurants',
    title: 'Restaurants',
    subtitle: 'Food & Drinks',
    imageUrl: '/tasty-food-banner.jpg',
    homeIconUrl: '/tasty-food-banner.jpg',
    badge: 'Food',
    vendorFormSchema: [
      { key: 'restaurantName', label: 'Restaurant / Cafe Name', type: 'text', required: true, order: 1 },
      { key: 'cuisineSpecialization', label: 'Cuisines Offered', type: 'multiselect', options: ['North Indian', 'South Indian', 'Chinese & Pan-Asian', 'Street Food & Chaat', 'Italian & Pizza', 'Fast Food & Burgers', 'Bakery & Desserts', 'Mughlai & Biryani', 'Sweets & Farsan'], required: true, order: 2 },
      { key: 'dietaryType', label: 'Dietary Classification', type: 'select', options: ['100% Pure Veg', 'Pure Veg & Jain Available', 'Veg & Non-Veg', 'Multi-Cuisine'], required: true, order: 3 },
      { key: 'dineInAvailable', label: 'Dine-In Seating Available', type: 'toggle', required: false, order: 4 },
      { key: 'seatingCapacity', label: 'Seating Capacity (Pax)', type: 'number', required: false, minValue: 0, order: 5 },
      { key: 'fssaiNumber', label: 'FSSAI License / Registration No.', type: 'text', required: true, helpText: '14-digit FSSAI number', order: 6 },
      { key: 'averageMealForTwo', label: 'Approx Cost for Two (₹)', type: 'number', required: false, minValue: 50, order: 7 }
    ]
  },
  {
    id: 'services',
    title: 'Services',
    subtitle: 'Home & Personal Repairs',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&auto=format&fit=crop&q=80',
    badge: 'Services',
    vendorFormSchema: [
      { key: 'serviceSpecialization', label: 'Services You Provide', type: 'multiselect', options: ['Electrician', 'Plumber', 'AC Repair & Servicing', 'Refrigerator & Washing Machine', 'RO Water Purifier', 'Carpenter', 'Painter', 'Deep Home Cleaning', 'Pest Control'], required: true, order: 1 },
      { key: 'experienceYears', label: 'Years of Experience', type: 'number', required: true, minValue: 0, maxValue: 50, order: 2 },
      { key: 'visitingCharge', label: 'Standard Visiting / Inspection Fee (₹)', type: 'number', required: true, helpText: 'Fee charged for visiting & diagnosing', minValue: 0, order: 3 },
      { key: 'emergencyAvailable', label: '24x7 Emergency Service Available', type: 'toggle', required: false, order: 4 },
      { key: 'serviceWarrantyDays', label: 'Service Warranty Provided', type: 'select', options: ['No Warranty', '7 Days Warranty', '15 Days Warranty', '30 Days Warranty', '90 Days Warranty'], required: false, order: 5 },
      { key: 'toolsAndEquipment', label: 'Tools / Equipment Carried', type: 'text', required: false, helpText: 'e.g. Drill, Multimeter, Pipe Wrench, Safety Kit', order: 6 }
    ]
  },
  {
    id: 'beauty-care',
    title: 'Beauty & Care',
    subtitle: 'Salon & Wellness',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&auto=format&fit=crop&q=80',
    badge: 'Beauty',
    vendorFormSchema: [
      { key: 'salonName', label: 'Salon / Parlour / Artist Name', type: 'text', required: true, order: 1 },
      { key: 'beautyServices', label: 'Services Offered', type: 'multiselect', options: ['Haircut & Styling', 'Facial & Clean-up', 'Bridal & Party Makeup', 'Hair Spa & Treatment', 'Waxing & Threading', 'Manicure & Pedicure', 'Nail Extensions & Art', "Men's Grooming & Beard Care"], required: true, order: 2 },
      { key: 'serviceMode', label: 'Service Location / Mode', type: 'select', options: ['At Salon / Studio Only', 'Home Visit / Doorstep Available', 'Both Salon & Home Visit'], required: true, order: 3 },
      { key: 'experienceYears', label: 'Experience (Years)', type: 'number', required: true, minValue: 0, order: 4 },
      { key: 'cosmeticBrands', label: 'Cosmetic / Hair Brands Used', type: 'text', required: false, helpText: 'e.g. L\'Oréal, MAC, Kryolan, Lotus, VLCC', order: 5 },
      { key: 'homeVisitExtraCharge', label: 'Home Visit Extra Charges (₹, if applicable)', type: 'number', required: false, minValue: 0, order: 6 }
    ]
  },
  {
    id: 'electronics',
    title: 'Electronics',
    subtitle: 'Gadgets & Repairs',
    imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&auto=format&fit=crop&q=80',
    badge: 'Electronics',
    vendorFormSchema: [
      { key: 'businessName', label: 'Electronics Store / Workshop Name', type: 'text', required: true, order: 1 },
      { key: 'categorySpecialization', label: 'Electronics Categories Handled', type: 'multiselect', options: ['Smartphone Sales & Accessories', 'Mobile Screen & Motherboard Repair', 'Laptops & Computer Repair', 'LED TV & Home Theater', 'Air Conditioners & Coolers', 'Smartwatches, Audio & Cables', 'CCTV & Security Cameras'], required: true, order: 2 },
      { key: 'repairServiceAvailable', label: 'Repair & Servicing Facility Available', type: 'toggle', required: false, order: 3 },
      { key: 'pickupDropAvailable', label: 'Free / Paid Device Pickup & Drop Available', type: 'toggle', required: false, order: 4 },
      { key: 'repairWarranty', label: 'Repair Warranty on Parts', type: 'select', options: ['No Warranty', '1 Month Warranty', '3 Months Warranty', '6 Months Warranty'], required: false, order: 5 },
      { key: 'operatingHours', label: 'Shop Timings', type: 'text', required: false, helpText: 'e.g. 10:00 AM - 9:00 PM', order: 6 }
    ]
  }
];

const SIGNUP_STORAGE_KEY = 'apna_market_vendor_signup_state';

const getSavedSignupState = () => {
  try {
    const saved = sessionStorage.getItem(SIGNUP_STORAGE_KEY) || localStorage.getItem(SIGNUP_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse saved vendor signup state:', e);
  }
  return null;
};

const VendorSignup = () => {
  const { branding } = useBranding();
  const appName = branding?.appName || APP_NAME;
  const navigate = useNavigate();
  const location = useLocation();

  const savedState = getSavedSignupState();

  const [stepIndex, setStepIndex] = useState(savedState?.stepIndex ?? 0); // 0 Info, 1 KYC, 2 Services, 3 Bank, 4 OTP, 5 Success
  const [providerType] = useState('INDIVIDUAL');
  const [categories, setCategories] = useState(DEFAULT_MARKET_CATEGORIES);

  // Multi-Service selection array
  const [selectedServices, setSelectedServices] = useState(savedState?.selectedServices || ['Shops']);
  const [activeTabCategory, setActiveTabCategory] = useState(savedState?.activeTabCategory || 'Shops');

  // Service Specific Form Answers map
  const [serviceDetailsMap, setServiceDetailsMap] = useState(savedState?.serviceDetailsMap || {});

  const [formData, setFormData] = useState(savedState?.formData || {
    name: '',
    email: '',
    phoneNumber: '',
    gender: 'Male',
    fullAddress: '',
    city: '',
    state: '',
    pincode: '',
    lat: null,
    lng: null,
    aadhar: '',
    pan: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    upiId: '',
    documents: [],
  });

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpToken, setOtpToken] = useState(savedState?.otpToken || '');
  const [verificationToken, setVerificationToken] = useState(savedState?.verificationToken || '');
  const [isLoading, setIsLoading] = useState(false);
  const [documentPreview, setDocumentPreview] = useState(savedState?.documentPreview || {});
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [resendTimer, setResendTimer] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const nameInputRef = useRef(null);

  const handleLocationSelect = (loc) => {
    setFormData((prev) => ({
      ...prev,
      fullAddress: loc.fullAddress || prev.fullAddress,
      city: loc.city || prev.city,
      state: loc.state || prev.state,
      pincode: loc.pincode || prev.pincode,
      lat: loc.lat,
      lng: loc.lng,
    }));
  };

  // Persist state to both sessionStorage and localStorage whenever it changes
  useEffect(() => {
    try {
      // Strip huge base64 data URLs to prevent browser QuotaExceededError (5MB limit)
      const lightweightDocs = (formData.documents || []).map(d => ({
        type: d.type,
        url: d.url && d.url.length < 1000 ? d.url : null
      }));

      const payload = JSON.stringify({
        stepIndex,
        selectedServices,
        activeTabCategory,
        serviceDetailsMap,
        formData: {
          ...formData,
          documents: lightweightDocs
        },
        otpToken,
        verificationToken
      });
      sessionStorage.setItem(SIGNUP_STORAGE_KEY, payload);
      localStorage.setItem(SIGNUP_STORAGE_KEY, payload);
    } catch (e) {
      console.error('Failed to persist vendor signup state:', e);
    }
  }, [stepIndex, selectedServices, activeTabCategory, serviceDetailsMap, formData, otpToken, verificationToken]);

  // Fetch categories from API with client-side caching & request deduplication
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await publicCatalogService.getCategories();
        if (res?.categories && res.categories.length > 0) {
          const fetched = res.categories.map((c, i) => {
            const fallbackCat = DEFAULT_MARKET_CATEGORIES.find((def) => {
              const dLow = def.title.toLowerCase().trim();
              const cLow = c.title.toLowerCase().trim();
              return dLow === cLow || dLow.includes(cLow) || cLow.includes(dLow);
            });

            return {
              id: c._id || c.id || String(i),
              title: c.title,
              subtitle: c.subtitle || fallbackCat?.subtitle || '',
              imageUrl: c.homeIconUrl || c.imageUrl || c.icon || fallbackCat?.imageUrl || '',
              homeIconUrl: c.homeIconUrl || c.imageUrl || c.icon || fallbackCat?.homeIconUrl || '',
              badge: c.homeBadge || fallbackCat?.badge || 'Active',
              vendorFormSchema: (c.vendorFormSchema && c.vendorFormSchema.length > 0)
                ? c.vendorFormSchema
                : (fallbackCat?.vendorFormSchema || [])
            };
          });
          setCategories(fetched);

          // Normalize any previously saved selectedServices & activeTabCategory to fetched titles
          setSelectedServices((prev) => {
            if (!prev || prev.length === 0) return [fetched[0].title];
            const mapped = prev.map((sTitle) => {
              const matched = fetched.find((fc) => {
                const fLow = fc.title.toLowerCase().trim();
                const sLow = sTitle.toLowerCase().trim();
                return fLow === sLow || fLow.includes(sLow) || sLow.includes(fLow);
              });
              return matched ? matched.title : sTitle;
            });
            const validTitles = fetched.map(f => f.title);
            const cleaned = [...new Set(mapped)].filter(t => validTitles.includes(t));
            return cleaned.length > 0 ? cleaned : [fetched[0].title];
          });

          setActiveTabCategory((prevTab) => {
            if (!prevTab) return fetched[0].title;
            const matched = fetched.find((fc) => {
              const fLow = fc.title.toLowerCase().trim();
              const pLow = prevTab.toLowerCase().trim();
              return fLow === pLow || fLow.includes(pLow) || pLow.includes(fLow);
            });
            return matched ? matched.title : fetched[0].title;
          });
        }
      } catch (err) {
        console.warn('Using default market categories', err);
      }
    };
    fetchCats();
  }, []);

  // Socket listener for real-time category schema updates
  useEffect(() => {
    try {
      const socket = window.socket || (window.io ? window.io() : null);
      if (!socket) return;

      const handleSchemaUpdate = (data) => {
        if (data && data.title && data.vendorFormSchema) {
          setCategories((prevCats) =>
            prevCats.map((cat) => {
              if (
                cat.title.toLowerCase().trim() === data.title.toLowerCase().trim() ||
                cat.id === data.categoryId
              ) {
                return { ...cat, vendorFormSchema: data.vendorFormSchema };
              }
              return cat;
            })
          );
          toast.success(`Form updated for "${data.title}" in real-time!`, { duration: 3000 });
        }
      };

      socket.on('category_schema_updated', handleSchemaUpdate);
      return () => {
        socket.off('category_schema_updated', handleSchemaUpdate);
      };
    } catch (e) {
      console.warn('Socket listener setup error:', e);
    }
  }, []);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (location.state?.phone && location.state?.verificationToken) {
      const cleanPhone = String(location.state.phone).replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, phoneNumber: cleanPhone }));
      setVerificationToken(location.state.verificationToken);
    }
  }, [location.state]);

  useEffect(() => {
    localStorage.removeItem('vendorAccessToken');
    localStorage.removeItem('vendorRefreshToken');
    localStorage.removeItem('vendorData');
  }, []);

  useEffect(() => {
    if (stepIndex === 0) setTimeout(() => nameInputRef.current?.focus(), 100);
  }, [stepIndex]);

  useEffect(() => {
    const otpValue = otp.join('');
    if (otpValue.length === 6 && !isLoading && otpToken && stepIndex === 4) {
      handleOtpSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  // Toggle Category selection (Multi-select)
  const toggleCategorySelection = (catTitle) => {
    if (selectedServices.includes(catTitle)) {
      if (selectedServices.length === 1) {
        toast.error('Please select at least 1 category');
        return;
      }
      const updated = selectedServices.filter((s) => s !== catTitle);
      setSelectedServices(updated);
      if (activeTabCategory === catTitle) {
        setActiveTabCategory(updated[0]);
      }
    } else {
      const updated = [...selectedServices, catTitle];
      setSelectedServices(updated);
      setActiveTabCategory(catTitle);
      // Initialize default form details for new category if missing
      if (!serviceDetailsMap[catTitle]) {
        setServiceDetailsMap((prev) => ({
          ...prev,
          [catTitle]: getDefaultDetailsForCategory(catTitle)
        }));
      }
    }
  };

  const getDefaultDetailsForCategory = (catTitle) => {
    const lower = (catTitle || '').toLowerCase();
    if (lower.includes('shop')) {
      return { shopName: '', storeType: 'Kirana / Grocery', deliveryAvailable: false, operatingHours: '8:00 AM - 10:00 PM' };
    } else if (lower.includes('cloth')) {
      return { boutiqueName: '', priceRange: 'Mid-Range (₹1,000 - ₹3,500)', alterationAvailable: false };
    } else if (lower.includes('rest') || lower.includes('food')) {
      return { restaurantName: '', dietaryType: '100% Pure Veg', dineInAvailable: true, fssaiNumber: '' };
    } else if (lower.includes('service')) {
      return { experienceYears: '3', visitingCharge: '99', emergencyAvailable: false };
    } else if (lower.includes('beauty') || lower.includes('salon')) {
      return { salonName: '', serviceMode: 'Both Salon & Home Visit', experienceYears: '3' };
    } else if (lower.includes('elect')) {
      return { businessName: '', repairServiceAvailable: true };
    }
    return {};
  };

  const updateServiceDetailField = (catTitle, field, value) => {
    setServiceDetailsMap((prev) => ({
      ...prev,
      [catTitle]: {
        ...(prev[catTitle] || getDefaultDetailsForCategory(catTitle)),
        [field]: value
      }
    }));
  };

  const handleDocumentUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image or PDF');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size should be less than 15MB');
      return;
    }

    setUploadingDocs((prev) => ({ ...prev, [type]: true }));
    const loadingToast = toast.loading('Processing file...');

    try {
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        try {
          fileToUpload = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.8 });
          toast.dismiss(loadingToast);
        } catch {
          toast.error('Compression skipped, uploading original');
        }
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const previewUrl = reader.result;
        setFormData((prev) => ({
          ...prev,
          documents: [
            ...prev.documents.filter((d) => d.type !== type),
            { type, file: fileToUpload, url: previewUrl },
          ],
        }));
        setDocumentPreview((prev) => ({ ...prev, [type]: previewUrl }));
        setUploadingDocs((prev) => ({ ...prev, [type]: false }));
        toast.success('Uploaded', { duration: 2000 });
      };
      reader.onerror = () => {
        toast.error('Failed to read file');
        setUploadingDocs((prev) => ({ ...prev, [type]: false }));
      };
      reader.readAsDataURL(fileToUpload);
    } catch {
      toast.dismiss(loadingToast);
      toast.error('Failed to process file');
      setUploadingDocs((prev) => ({ ...prev, [type]: false }));
    }
  };

  const removeDocument = (type) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.type !== type),
    }));
    setDocumentPreview((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
  };

  const buildRegisterPayload = (extra = {}) => {
    const aadharDoc = documentPreview.aadhar || formData.documents.find((d) => d.type === 'aadhar')?.url || null;
    const aadharBackDoc = documentPreview.aadharBack || formData.documents.find((d) => d.type === 'aadharBack')?.url || null;
    const panDoc = documentPreview.pan || formData.documents.find((d) => d.type === 'pan')?.url || null;
    const profilePhotoDoc = documentPreview.profilePhoto || formData.documents.find((d) => d.type === 'profilePhoto')?.url || null;
    const otherDocs = formData.documents.filter((d) => d.type === 'other').map((d) => d.url).filter(Boolean);

    return {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: String(formData.phoneNumber).replace(/\D/g, '').slice(0, 10),
      providerType: 'INDIVIDUAL',
      address: {
        fullAddress: formData.fullAddress,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        lat: formData.lat != null ? Number(formData.lat) : undefined,
        lng: formData.lng != null ? Number(formData.lng) : undefined
      },
      location: (formData.lat != null && formData.lng != null) ? {
        type: 'Point',
        coordinates: [Number(formData.lng), Number(formData.lat)]
      } : undefined,
      aadhar: formData.aadhar,
      pan: formData.pan,
      service: selectedServices,
      services: selectedServices,
      serviceDetails: serviceDetailsMap,
      dynamicFormAnswers: serviceDetailsMap,
      aadharDocument: aadharDoc,
      aadharBackDocument: aadharBackDoc,
      panDocument: panDoc,
      profilePhoto: profilePhotoDoc,
      otherDocuments: otherDocs,
      bankDetails: {
        accountHolderName: formData.accountHolderName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        bankName: formData.bankName,
        upiId: formData.upiId
      },
      ...extra,
    };
  };

  const goNextFromInfo = () => {
    setFieldErrors({});

    if (verificationToken) {
      const nameCheck = z.string().trim().min(2).safeParse(formData.name);
      if (!nameCheck.success) {
        toast.error('Please enter a valid name (at least 2 characters)');
        return;
      }
      const phone = String(formData.phoneNumber || location.state?.phone || '').replace(/\D/g, '').slice(0, 10);
      if (phone.length !== 10) {
        toast.error('Verified phone missing. Please sign in and try again.');
        navigate('/vendor/login', { replace: true });
        return;
      }
      setStepIndex(1);
      return;
    }

    const result = profileSchema.safeParse({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber.trim(),
    });

    if (!result.success) {
      const errs = {};
      result.error.errors.forEach((err) => {
        errs[err.path[0]] = err.message;
        toast.error(err.message);
      });
      setFieldErrors(errs);
      return;
    }
    setStepIndex(1);
  };

  const goNextFromIdentity = () => {
    setFieldErrors({});
    const result = identitySchema.safeParse({
      aadhar: formData.aadhar,
      pan: formData.pan,
    });
    if (!result.success) {
      const errs = {};
      result.error.errors.forEach((err) => {
        errs[err.path[0]] = err.message;
        toast.error(err.message);
      });
      setFieldErrors(errs);
      return;
    }

    // Go to Step 2 (Category & Services requirements)
    setStepIndex(2);
  };

  const goNextFromServices = () => {
    if (!selectedServices || selectedServices.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    // Validate required fields for all selected categories
    for (const catTitle of selectedServices) {
      const catObj = categories.find((c) => {
        const cLow = (c.title || '').toLowerCase().trim();
        const sLow = catTitle.toLowerCase().trim();
        return cLow === sLow || cLow.includes(sLow) || sLow.includes(cLow);
      });

      const schema = catObj?.vendorFormSchema || [];
      const answers = serviceDetailsMap[catTitle] || serviceDetailsMap[catObj?.title] || {};

      for (const field of schema) {
        if (field.required) {
          const val = answers[field.key];
          const isEmpty =
            val === undefined ||
            val === null ||
            (typeof val === 'string' && val.trim() === '') ||
            (Array.isArray(val) && val.length === 0);

          if (isEmpty) {
            setActiveTabCategory(catTitle);
            toast.error(`Please fill "${field.label}" for ${catTitle}`);
            return;
          }
        }
      }
    }

    setStepIndex(3);
  };

  const submitFullOnboarding = async (isSkipBank = false) => {
    setFieldErrors({});
    if (!isSkipBank) {
      const hasEnteredBankInfo = formData.accountHolderName || formData.accountNumber || formData.ifscCode;
      if (hasEnteredBankInfo) {
        const result = bankSchema.safeParse({
          accountHolderName: formData.accountHolderName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode.toUpperCase()
        });

        if (!result.success) {
          const errs = {};
          result.error.errors.forEach((err) => {
            errs[err.path[0]] = err.message;
            toast.error(err.message);
          });
          setFieldErrors(errs);
          return;
        }
      }
    }

    setIsLoading(true);

    if (verificationToken) {
      try {
        const response = await register(buildRegisterPayload({ verificationToken }));
        if (response.success) {
          sessionStorage.removeItem(SIGNUP_STORAGE_KEY);
          localStorage.removeItem(SIGNUP_STORAGE_KEY);
          setStepIndex(5);
          toast.success('Application Submitted Successfully!');
        } else if (response.code === AUTH_ERROR_CODES.ACCOUNT_EXISTS || isAccountExistsError(response)) {
          navigate('/vendor/login', {
            replace: true,
            state: { phone: formData.phoneNumber, fromSignup: true },
          });
        } else {
          toast.error(response.message || 'Registration failed');
        }
      } catch (error) {
        if (
          !handleAuthFlowError(error, navigate, {
            panel: 'vendor',
            phone: formData.phoneNumber,
          })
        ) {
          toast.error(getNetworkAuthMessage(error, 'Registration failed'));
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const response = await sendVendorOTP(formData.phoneNumber.replace(/\D/g, ''), 'signup');
      if (response.success) {
        setOtpToken(response.token || 'verification-pending');
        setStepIndex(4);
        setResendTimer(120);
        toast.success('OTP sent successfully to +91 ' + formData.phoneNumber);
      } else if (response.code === AUTH_ERROR_CODES.ACCOUNT_EXISTS || isAccountExistsError(response)) {
        navigate('/vendor/login', {
          replace: true,
          state: { phone: formData.phoneNumber, fromSignup: true },
        });
      } else {
        toast.error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      if (
        !handleAuthFlowError(error, navigate, {
          panel: 'vendor',
          phone: formData.phoneNumber,
        })
      ) {
        toast.error(getNetworkAuthMessage(error, 'Failed to send OTP'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter complete 6-digit OTP');
      return;
    }
    if (!otpToken) {
      toast.error('Please request OTP first');
      return;
    }
    setIsLoading(true);
    try {
      const response = await register(buildRegisterPayload({ otp: otpValue, token: otpToken }));
      if (response.success) {
        sessionStorage.removeItem(SIGNUP_STORAGE_KEY);
        localStorage.removeItem(SIGNUP_STORAGE_KEY);
        setStepIndex(5);
        toast.success('Provider onboarding complete! Pending admin approval.');
      } else if (response.code === AUTH_ERROR_CODES.ACCOUNT_EXISTS || isAccountExistsError(response)) {
        navigate('/vendor/login', {
          replace: true,
          state: { phone: formData.phoneNumber, fromSignup: true },
        });
      } else {
        toast.error(response.message || 'Registration failed');
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      if (
        !handleAuthFlowError(error, navigate, {
          panel: 'vendor',
          phone: formData.phoneNumber,
        })
      ) {
        toast.error(getNetworkAuthMessage(error, 'Registration failed'));
      }
    }
  };

  const titles = [
    'Personal & Location Details',
    'Identity & KYC Verification',
    'Category & Requirements',
    'Bank Account & Payout Setup',
    'Verify Mobile Phone Number',
    'Application Submitted Successfully',
  ];

  const subtitles = [
    'Enter your name, contact, and address details',
    'Enter your Aadhaar & PAN card details for verification',
    'Select your category and fill the required business details',
    'Enter bank details to receive payouts directly',
    `Enter the 6-digit code sent to +91 ${formData.phoneNumber}`,
    `Your provider account is under review by ${appName} admin team`,
  ];

  const renderServiceSpecificForm = (catTitle) => {
    if (!catTitle) return null;
    const targetLow = catTitle.toLowerCase().trim();
    const cleanTarget = targetLow.replace(/ booking$/, '').replace(/ service$/, '');

    const catObj = categories.find((c) => {
      const cLow = (c.title || '').toLowerCase().trim();
      const cleanCLow = cLow.replace(/ booking$/, '').replace(/ service$/, '');
      return (
        cLow === targetLow ||
        cleanCLow === cleanTarget ||
        cLow.includes(cleanTarget) ||
        targetLow.includes(cleanCLow)
      );
    });

    const schema = catObj?.vendorFormSchema || [];
    const details = serviceDetailsMap[catTitle] || serviceDetailsMap[catObj?.title] || {};

    if (schema.length > 0) {
      return (
        <div className="space-y-3">
          {schema
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((field) => {
              const val = details[field.key] !== undefined ? details[field.key] : '';

              if (field.type === 'select') {
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {field.label}{field.required ? ' *' : ''}
                    </label>
                    {field.helpText && <p className="text-[10px] text-slate-400 mb-1">{field.helpText}</p>}
                    <select
                      value={val}
                      onChange={(e) => updateServiceDetailField(catTitle, field.key, e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-primary-400 outline-none"
                    >
                      <option value="">Select Option...</option>
                      {(field.options || []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (field.type === 'multiselect') {
                const currentArr = Array.isArray(val)
                  ? val
                  : typeof val === 'string' && val ? val.split(', ') : [];
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {field.label}{field.required ? ' *' : ''}
                    </label>
                    {field.helpText && <p className="text-[10px] text-slate-400 mb-1">{field.helpText}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      {(field.options || []).map((opt) => {
                        const isSel = currentArr.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              const updated = isSel
                                ? currentArr.filter((v) => v !== opt)
                                : [...currentArr, opt];
                              updateServiceDetailField(catTitle, field.key, updated.join(', '));
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              isSel
                                ? 'bg-primary-500 text-white border-primary-500'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {isSel && <FiCheck className="inline mr-1 text-xs" />}{opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              if (field.type === 'toggle') {
                const isChecked = Boolean(val === true || val === 'true');
                return (
                  <div key={field.key} className="flex items-center justify-between py-2 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-slate-700">{field.label}</span>
                      {field.helpText && <p className="text-[10px] text-slate-400">{field.helpText}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => updateServiceDetailField(catTitle, field.key, !isChecked)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${isChecked ? 'bg-primary-500' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${isChecked ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                );
              }

              if (field.type === 'textarea') {
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {field.label}{field.required ? ' *' : ''}
                    </label>
                    <textarea
                      rows={2}
                      value={val}
                      onChange={(e) => updateServiceDetailField(catTitle, field.key, e.target.value)}
                      placeholder={field.helpText || `Enter ${field.label.toLowerCase()}`}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-primary-400 outline-none resize-none"
                    />
                  </div>
                );
              }

              if (field.type === 'file') {
                return (
                  <div key={field.key} className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {field.label}{field.required ? ' *' : ''}
                    </label>
                    {field.helpText && <p className="text-[10px] text-slate-400 mb-1">{field.helpText}</p>}
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-primary-300 bg-primary-50/50 hover:bg-primary-50 cursor-pointer text-xs font-bold text-primary-700 transition-colors">
                        <FiUploadCloud className="w-4 h-4 text-primary-600" />
                        <span>{val ? 'Change Document' : 'Upload Document'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              updateServiceDetailField(catTitle, field.key, reader.result);
                              toast.success(`${field.label} attached`);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {val && (
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                          <FiCheck className="w-3.5 h-3.5" /> Attached
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <Input
                  key={field.key}
                  label={`${field.label}${field.required ? ' *' : ''}`}
                  type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'}
                  value={val}
                  onChange={(e) => updateServiceDetailField(catTitle, field.key, e.target.value)}
                  placeholder={field.helpText || `Enter ${field.label.toLowerCase()}`}
                />
              );
            })}
        </div>
      );
    }

    // Fallback if vendorFormSchema is empty
    return (
      <div className="space-y-3">
        <Input
          label="Business / Store Name *"
          value={details.shopName || details.businessName || ''}
          onChange={(e) => updateServiceDetailField(catTitle, 'businessName', e.target.value)}
          placeholder={`Enter your ${catTitle} business name`}
        />
        <Input
          label="Years of Experience *"
          type="number"
          value={details.experienceYears || '3'}
          onChange={(e) => updateServiceDetailField(catTitle, 'experienceYears', e.target.value)}
          placeholder="3"
        />
        <Input
          label="Operating Hours"
          value={details.operatingHours || '9:00 AM - 9:00 PM'}
          onChange={(e) => updateServiceDetailField(catTitle, 'operatingHours', e.target.value)}
          placeholder="e.g. 9:00 AM - 9:00 PM"
        />
      </div>
    );
  };

  return (
    <AuthShell
      maxWidth="2xl"
      onBack={
        stepIndex === 0
          ? () => navigate('/vendor/login')
          : stepIndex === 5
            ? undefined
            : () => setStepIndex((p) => p - 1)
      }
      title={titles[stepIndex]}
      subtitle={subtitles[stepIndex]}
      footer={
        stepIndex !== 5 ? (
          <p className="text-sm text-neutral-500">
            Already a partner?{' '}
            <Link to="/vendor/login" className="text-primary-500 font-semibold hover:underline">
              Login here
            </Link>
          </p>
        ) : null
      }
    >
      {stepIndex < 5 && <StepIndicator steps={STEPS} current={stepIndex} className="mb-6" />}

      {/* STEP 0 — Personal & Location Details */}
      {stepIndex === 0 && (
        <div className="space-y-4 max-w-lg mx-auto">
          <Input
            ref={nameInputRef}
            label="Full Name *"
            leftIcon={FiUser}
            required
            value={formData.name}
            error={fieldErrors.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            placeholder="Enter your full name as per Aadhaar"
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Gender
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Male', 'Female', 'Other'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, gender: g }))}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    formData.gender === g
                      ? 'border-primary-500 bg-primary-50 text-primary-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Email Address *"
            leftIcon={FiMail}
            type="email"
            required
            value={formData.email}
            error={fieldErrors.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            placeholder="vendor@example.com"
          />

          {!verificationToken && (
            <Input
              label="Mobile Phone Number *"
              leftIcon={FiPhone}
              prefix="+91"
              type="tel"
              required
              value={formData.phoneNumber}
              error={fieldErrors.phoneNumber}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                }))
              }
              placeholder="9876543210"
            />
          )}

          {/* Interactive Google Maps Location Picker (Type Specific Location or Live GPS) */}
          <div className="pt-1">
            <VendorLocationPicker
              initialPosition={formData.lat && formData.lng ? { lat: formData.lat, lng: formData.lng } : null}
              onLocationSelect={handleLocationSelect}
              placeholder="Search shop address, market, or landmark..."
            />
          </div>

          <Input
            label="Street Address / Location *"
            leftIcon={FiMapPin}
            value={formData.fullAddress}
            onChange={(e) => setFormData((p) => ({ ...p, fullAddress: e.target.value }))}
            placeholder="Shop / House No, Street, Landmark"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City *"
              value={formData.city}
              onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
              placeholder="e.g. Indore"
            />

            <Input
              label="Pincode *"
              value={formData.pincode}
              onChange={(e) => setFormData((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
              placeholder="e.g. 452001"
            />
          </div>

          <Input
            label="State *"
            value={formData.state}
            onChange={(e) => setFormData((p) => ({ ...p, state: e.target.value }))}
            placeholder="e.g. Madhya Pradesh"
          />

          <Button
            type="button"
            variant="primary"
            size="xl"
            fullWidth
            icon={FiArrowRight}
            iconPosition="right"
            onClick={goNextFromInfo}
            className="pt-2"
          >
            Continue to KYC
          </Button>
        </div>
      )}

      {/* STEP 1 — Identity & KYC Verification Documents */}
      {stepIndex === 1 && (
        <div className="space-y-4 max-w-lg mx-auto">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary-50 border border-primary-100 text-xs text-blue-800">
            <FiShield className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
            <p>
              Your KYC details are encrypted and stored securely. {appName} never exposes unmasked Aadhaar/PAN to customers.
            </p>
          </div>

          <Input
            label="Aadhaar Number *"
            leftIcon={FiFileText}
            required
            value={formData.aadhar}
            error={fieldErrors.aadhar}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                aadhar: e.target.value.replace(/\D/g, '').slice(0, 12),
              }))
            }
            placeholder="123456789012"
            hint="12 digits without spaces"
          />

          <Input
            label="PAN Card Number *"
            leftIcon={FiFileText}
            required
            value={formData.pan}
            error={fieldErrors.pan}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                pan: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10),
              }))
            }
            placeholder="ABCDE1234F"
          />

          {/* Note: ID photo upload removed as per requirement */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-500">
            ✓ Your ID numbers will be verified digitally. No document photo uploads required.
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" size="xl" onClick={() => setStepIndex(0)}>
              <FiChevronLeft className="mr-1" /> Back
            </Button>
            <Button
              type="button"
              variant="primary"
              size="xl"
              fullWidth
              icon={FiArrowRight}
              iconPosition="right"
              onClick={goNextFromIdentity}
            >
              Continue to Category & Services
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2 — Category Selection & Dynamic Form (Admin vendorFormSchema) */}
      {stepIndex === 2 && (
        <div className="space-y-5 max-w-xl mx-auto">
          {/* Header instructions */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-primary-500/30">
              <FiLayers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Select Categories You Offer</h4>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-relaxed">
                Choose one or more business categories. For each category, fill out the custom dynamic form created by the admin.
              </p>
            </div>
          </div>

          {/* Category Selection Cards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Available Categories ({categories.length})
              </label>
              <span className="text-[11px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">
                {selectedServices.length} Selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {categories.map((cat) => {
                const isSelected = selectedServices.includes(cat.title);
                const imageSrc = cat.imageUrl || cat.homeIconUrl || cat.icon;
                return (
                  <button
                    key={cat.id || cat.title}
                    type="button"
                    onClick={() => toggleCategorySelection(cat.title)}
                    className={`relative p-2.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between group overflow-hidden ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/50 shadow-sm ring-2 ring-primary-400/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
                    }`}
                  >
                    {/* Top row with image / icon & check badge */}
                    <div className="flex items-start justify-between w-full mb-2">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                        {imageSrc && typeof imageSrc === 'string' && (imageSrc.startsWith('http') || imageSrc.startsWith('/')) ? (
                          <img
                            src={imageSrc}
                            alt={cat.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <FiShoppingBag className="w-5 h-5 text-primary-600" />
                        )}
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'bg-primary-500 text-white shadow-xs' : 'border border-slate-300 bg-white text-transparent'
                        }`}
                      >
                        <FiCheck className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>

                    {/* Title and subtitle */}
                    <div>
                      <h4 className="text-xs font-black text-slate-800 leading-tight truncate">{cat.title}</h4>
                      {cat.subtitle && (
                        <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{cat.subtitle}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* If multiple categories selected, Category Tab Switcher */}
          {selectedServices.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Fill Details For:
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Switch tabs to complete each category</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {selectedServices.map((catTitle) => {
                  const isActive = activeTabCategory === catTitle;
                  return (
                    <button
                      key={catTitle}
                      type="button"
                      onClick={() => setActiveTabCategory(catTitle)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/25'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{catTitle}</span>
                      {isActive && <FiCheck className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Form for Active Category */}
          {activeTabCategory && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                    <FiSliders className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 leading-none">
                      {activeTabCategory} Requirements
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      Admin-configured form schema for this category
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Dynamic Form
                </span>
              </div>

              {renderServiceSpecificForm(activeTabCategory)}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" size="xl" onClick={() => setStepIndex(1)}>
              <FiChevronLeft className="mr-1" /> Back
            </Button>
            <Button
              type="button"
              variant="primary"
              size="xl"
              fullWidth
              icon={FiArrowRight}
              iconPosition="right"
              onClick={goNextFromServices}
            >
              Continue to Bank Details
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 — Bank Account & Payout Setup */}
      {stepIndex === 3 && (
        <div className="space-y-4 max-w-lg mx-auto">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary-50 border border-primary-100 text-xs text-blue-800">
            <FiCreditCard className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
            <p>
              Payouts from completed customer bookings will be transferred safely to this bank account.
            </p>
          </div>

          <Input
            label="Account Holder Name *"
            leftIcon={FiUser}
            required
            value={formData.accountHolderName}
            error={fieldErrors.accountHolderName}
            onChange={(e) => setFormData((p) => ({ ...p, accountHolderName: e.target.value }))}
            placeholder="As per bank account passbook"
          />

          <Input
            label="Bank Account Number *"
            leftIcon={FiCreditCard}
            required
            value={formData.accountNumber}
            error={fieldErrors.accountNumber}
            onChange={(e) => setFormData((p) => ({ ...p, accountNumber: e.target.value.replace(/\D/g, '') }))}
            placeholder="123456789012"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="IFSC Code *"
              required
              value={formData.ifscCode}
              error={fieldErrors.ifscCode}
              onChange={(e) => setFormData((p) => ({ ...p, ifscCode: e.target.value.toUpperCase() }))}
              placeholder="SBIN0001234"
            />
            <Input
              label="Bank Name (Optional)"
              value={formData.bankName}
              onChange={(e) => setFormData((p) => ({ ...p, bankName: e.target.value }))}
              placeholder="State Bank of India"
            />
          </div>

          <Input
            label="UPI ID (Optional)"
            value={formData.upiId}
            onChange={(e) => setFormData((p) => ({ ...p, upiId: e.target.value.toLowerCase() }))}
            placeholder="name@upi or mobile@ybl"
          />

          <div className="flex flex-col gap-3 pt-2">
            <div className="flex gap-3">
              <Button type="button" variant="outline" size="xl" onClick={() => setStepIndex(2)}>
                <FiChevronLeft className="mr-1" /> Back
              </Button>
              <Button
                type="button"
                variant="primary"
                size="xl"
                fullWidth
                isLoading={isLoading}
                icon={FiArrowRight}
                iconPosition="right"
                onClick={() => submitFullOnboarding(false)}
              >
                {verificationToken ? 'Submit Application' : 'Save & Send OTP'}
              </Button>
            </div>

            <button
              type="button"
              onClick={() => submitFullOnboarding(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Skip Bank Details for Now (Add later during withdrawal)</span>
              <FiArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — Phone OTP Verification */}
      {stepIndex === 4 && (
        <form onSubmit={handleOtpSubmit} className="space-y-6 max-w-md mx-auto">
          <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setStepIndex(3)}
              className="flex items-center font-medium text-neutral-500 hover:text-neutral-800"
            >
              <FiChevronLeft className="mr-1" /> Back to Bank Details
            </button>
            <button
              type="button"
              disabled={resendTimer > 0}
              onClick={async () => {
                if (resendTimer > 0) return;
                try {
                  const response = await sendVendorOTP(formData.phoneNumber);
                  if (response.success) {
                    setOtpToken(response.token);
                    setResendTimer(120);
                    toast.success('OTP sent again');
                  }
                } catch {
                  toast.error('Resend failed');
                }
              }}
              className="font-medium text-primary-500 disabled:opacity-50"
            >
              {resendTimer > 0
                ? `Resend in ${Math.floor(resendTimer / 60)}:${String(resendTimer % 60).padStart(2, '0')}`
                : 'Resend Code'}
            </button>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            isLoading={isLoading}
            disabled={otp.join('').length !== 6}
            icon={FiArrowRight}
            iconPosition="right"
          >
            Verify & Complete Registration
          </Button>
        </form>
      )}

      {/* STEP 5 — Application Submitted Success Screen */}
      {stepIndex === 5 && (
        <div className="py-6 px-4 text-center space-y-6 max-w-md mx-auto">
          {/* Animated Success Icon */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center animate-bounce shadow-md">
              <FiCheckCircle className="w-12 h-12 text-emerald-600" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Application Submitted! 🎉</h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Thank you for registering with <span className="font-extrabold text-slate-900">{appName}</span>. Your application has been received and is currently <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs inline-block">Under Admin Review</span>.
            </p>
          </div>

          {/* Application Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2.5 text-xs shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Applicant Name</span>
              <span className="font-black text-slate-800 text-xs">{formData.name}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Mobile Number</span>
              <span className="font-bold text-slate-800 text-xs">+91 {formData.phoneNumber}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Selected Categories</span>
              <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                {selectedServices.map(s => (
                  <span key={s} className="px-2 py-0.5 rounded-md bg-primary-100 text-primary-800 font-bold text-[10px]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-primary-50/70 border border-primary-100 text-xs text-blue-800 flex items-start gap-2.5 text-left">
            <FiShield className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
            <p className="leading-snug">
              Our team usually verifies documents within <strong>24 hours</strong>. Once approved, you will receive confirmation and can log in to your vendor panel.
            </p>
          </div>

          {/* Login Redirect Button */}
          <Button
            type="button"
            variant="primary"
            size="xl"
            fullWidth
            icon={FiArrowRight}
            iconPosition="right"
            onClick={() => {
              sessionStorage.removeItem(SIGNUP_STORAGE_KEY);
              localStorage.removeItem(SIGNUP_STORAGE_KEY);
              navigate('/vendor/login');
            }}
            className="py-3.5 font-black tracking-wide text-sm bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg shadow-primary-500/25"
          >
            Go to Vendor Login
          </Button>
        </div>
      )}
    </AuthShell>
  );
};

export default VendorSignup;
