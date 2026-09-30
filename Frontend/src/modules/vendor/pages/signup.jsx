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

const STEPS = ['Details', 'Identity & KYC', 'Bank Details', 'Verify OTP'];

const ALL_16_CATEGORIES = [
  {
    id: '1',
    title: 'Driver Booking',
    icon: FiNavigation,
    badge: 'Instant & Outstation',
    vendorFormSchema: [
      { key: 'drivingLicense', label: 'Driving License Number', type: 'text', required: true, order: 1 },
      { key: 'licenseType', label: 'License Type', type: 'select', options: ['LMV Commercial', 'LMV Private', 'HMV Heavy Vehicle', 'Transport Vehicle'], required: true, order: 2 },
      { key: 'experienceYears', label: 'Driving Experience (Years)', type: 'number', required: true, order: 3 },
      { key: 'serviceType', label: 'Service Type Offered', type: 'multiselect', options: ['Driver Only', 'Driver + Vehicle'], required: true, order: 4 },
      { key: 'vehicleTypes', label: 'Driveable Vehicle Types', type: 'multiselect', options: ['Hatchback', 'Sedan', 'SUV', 'Luxury', 'Tempo Traveller', 'Mini Bus'], order: 5 },
      { key: 'routeTypes', label: 'Route Availability', type: 'multiselect', options: ['Local', 'Outstation', 'Airport Transfer', 'Corporate', 'One-Way', 'Round-Trip'], required: true, order: 6 },
    ]
  },
  {
    id: '2',
    title: 'Cook / Maharaj Booking',
    icon: FiCoffee,
    badge: 'Popular & Daily',
    vendorFormSchema: [
      { key: 'cuisineSpecialization', label: 'Cuisine Specialization', type: 'multiselect', options: ['North Indian', 'South Indian', 'Gujarati', 'Rajasthani', 'Jain', 'Chinese', 'Continental', 'Mughlai', 'Punjabi'], required: true, order: 1 },
      { key: 'dietType', label: 'Diet Preference', type: 'select', options: ['Pure Veg', 'Veg & Non-Veg', 'Non-Veg Only'], required: true, order: 2 },
      { key: 'experienceYears', label: 'Years of Experience', type: 'number', required: true, order: 3 },
      { key: 'serviceType', label: 'Service Type', type: 'multiselect', options: ['Daily Cook', 'Part-time Cook', 'Full-time Cook', 'Event / Maharaj', 'Party Cook'], required: true, order: 4 },
      { key: 'meals', label: 'Meals Prepared', type: 'multiselect', options: ['Breakfast', 'Lunch', 'Dinner', 'Snacks/Tea'], required: true, order: 5 },
    ]
  },
  {
    id: '3',
    title: 'Worker / Helper Booking',
    icon: FiUsers,
    badge: 'Labour & Shifting',
    vendorFormSchema: [
      { key: 'experienceYears', label: 'Years of Experience', type: 'number', required: true, order: 1 },
      { key: 'workerSkills', label: 'Skills & Work Offered', type: 'multiselect', options: ['Loading / Unloading', 'House Shifting', 'Construction Labour', 'Gardening', 'Packing', 'Cleaning', 'General Helper'], required: true, order: 2 },
      { key: 'workersAvailable', label: 'Number of Workers Available', type: 'number', required: true, order: 3 },
    ]
  },
  {
    id: '4',
    title: 'Tiffin Service Booking',
    icon: FiPackage,
    badge: 'Subscription',
    vendorFormSchema: [
      { key: 'tiffinServiceName', label: 'Kitchen / Tiffin Name', type: 'text', required: true, order: 1 },
      { key: 'dietType', label: 'Food Type', type: 'multiselect', options: ['Veg', 'Jain', 'Non-Veg', 'Vegan', 'Special Health Meal'], required: true, order: 2 },
      { key: 'meals', label: 'Meals Available', type: 'multiselect', options: ['Breakfast', 'Lunch', 'Dinner'], required: true, order: 3 },
      { key: 'subscriptionTypes', label: 'Subscription Plans', type: 'multiselect', options: ['Daily Trial', 'Weekly Plan', 'Monthly Plan'], required: true, order: 4 },
    ]
  },
  {
    id: '5',
    title: 'DJ Sound Booking',
    icon: FiMusic,
    badge: 'Party & Wedding',
    vendorFormSchema: [
      { key: 'djName', label: 'DJ / Band Name', type: 'text', required: true, order: 1 },
      { key: 'experienceYears', label: 'Years of Experience', type: 'number', required: true, order: 2 },
      { key: 'equipment', label: 'Equipment Setup', type: 'multiselect', options: ['Dual DJ Console', 'JBL Sound System', 'Subwoofers', 'LED Moving Lights', 'Laser & Smoke Machine', 'Wireless Mics'], required: true, order: 3 },
    ]
  },
  {
    id: '6',
    title: 'Photographer & Videographer Booking',
    icon: FiCamera,
    badge: 'Event & Shoot',
    vendorFormSchema: [
      { key: 'experienceYears', label: 'Years of Experience', type: 'number', required: true, order: 1 },
      { key: 'photographyStyle', label: 'Style & Specialization', type: 'multiselect', options: ['Traditional', 'Candid', 'Cinematic Video', 'Drone Shoot', 'Pre-Wedding', 'Product Shoot', 'Fashion Shoot'], order: 2 },
      { key: 'cameraEquipment', label: 'Camera & Gear List', type: 'text', helpText: 'e.g. Sony A7IV, Canon R6, DJI Drone', order: 3 },
    ]
  },
  {
    id: '7',
    title: 'Makeup Artist Booking',
    icon: FiSun,
    badge: 'Bridal & Party',
    vendorFormSchema: [
      { key: 'experienceYears', label: 'Years of Experience', type: 'number', required: true, order: 1 },
      { key: 'services', label: 'Services Offered', type: 'multiselect', options: ['Bridal Makeup', 'Party Makeup', 'Engagement Look', 'HD Airbrush', 'Hair Styling', 'Saree Draping', 'Nail Art'], required: true, order: 2 },
      { key: 'makeupBrands', label: 'Cosmetic Brands Used', type: 'text', helpText: 'e.g. MAC, Kryolan, Huda Beauty, Bobbi Brown', order: 3 },
    ]
  },
  {
    id: '8',
    title: 'Healthcare Service (Home Nurse / Caretaker / Patient Attendant)',
    icon: FiActivity,
    badge: 'Patient Care',
    vendorFormSchema: [
      { key: 'providerSubType', label: 'Provider Role', type: 'select', options: ['GNM/B.Sc Nurse', 'Caretaker / Attendant', 'Elderly Care', 'Post-Surgery Nurse', 'Baby Caretaker', 'Physiotherapist'], required: true, order: 1 },
      { key: 'qualification', label: 'Qualifications / Certificate', type: 'text', required: true, order: 2 },
      { key: 'experienceYears', label: 'Years of Experience', type: 'number', required: true, order: 3 },
      { key: 'shiftType', label: 'Shift Options', type: 'multiselect', options: ['8 Hours', '12 Hours', '24 Hours Live-in'], required: true, order: 4 },
    ]
  },
  {
    id: '9',
    title: 'Room Booking (Monthly & Yearly Rental)',
    icon: FiKey,
    badge: 'Monthly Rent',
    vendorFormSchema: [
      { key: 'propertyName', label: 'Property / Building Name', type: 'text', required: true, order: 1 },
      { key: 'propertyType', label: 'Property Type', type: 'select', options: ['Single Room PG', 'Double Sharing PG', 'Furnished AC Room', '1BHK Flat', '2BHK Flat', 'Studio Apartment'], required: true, order: 2 },
      { key: 'furnishing', label: 'Furnishing Status', type: 'select', options: ['Fully Furnished', 'Semi-Furnished', 'Unfurnished'], required: true, order: 3 },
      { key: 'amenities', label: 'Amenities Included', type: 'multiselect', options: ['WiFi', 'AC', 'Kitchen', 'Washing Machine', 'Security', 'Power Backup', 'RO Water', 'Parking'], order: 4 },
    ]
  },
  {
    id: '10',
    title: 'Marriage Hall Booking',
    icon: FiMap,
    badge: 'Hall & Lawns',
    vendorFormSchema: [
      { key: 'hallName', label: 'Hall / Venue Name', type: 'text', required: true, order: 1 },
      { key: 'indoorCapacity', label: 'Indoor Seating Capacity', type: 'number', required: true, order: 2 },
      { key: 'facilities', label: 'Facilities Available', type: 'multiselect', options: ['AC Hall', 'Catering Kitchen', 'Decoration', 'DJ Stage', 'Green Room', 'Bridal Suite', 'Parking & Valet', 'Generator'], required: true, order: 3 },
    ]
  },
  {
    id: '11',
    title: 'Security Guard Booking',
    icon: FiShield,
    badge: 'Residential & Commercial',
    vendorFormSchema: [
      { key: 'experienceYears', label: 'Years of Experience', type: 'number', required: true, order: 1 },
      { key: 'securityType', label: 'Security Type Offered', type: 'multiselect', options: ['Residential Society', 'Commercial / Office', 'Event Security', 'Hospital / School', 'Personal Bodyguard'], required: true, order: 2 },
      { key: 'guardsAvailable', label: 'Total Guards Available', type: 'number', required: true, order: 3 },
    ]
  },
  {
    id: '12',
    title: 'Housekeeping & Home Cleaning Booking',
    icon: FiHome,
    badge: 'Deep Cleaning',
    vendorFormSchema: [
      { key: 'experienceYears', label: 'Years of Experience', type: 'number', required: true, order: 1 },
      { key: 'cleaningTypes', label: 'Cleaning Services', type: 'multiselect', options: ['Full Home Deep Cleaning', 'Kitchen Deep Cleaning', 'Bathroom Scrubbing', 'Sofa & Carpet Cleaning', 'Move-in/Move-out Cleaning', 'Floor Polishing'], required: true, order: 2 },
    ]
  },
  {
    id: '13',
    title: 'Electrician Booking',
    icon: FiZap,
    badge: 'Popular',
    vendorFormSchema: [
      { key: 'experienceYears', label: 'Years of Experience', type: 'number', required: true, order: 1 },
      { key: 'services', label: 'Services Offered', type: 'multiselect', options: ['Fan Installation', 'Switch & Socket Repair', 'Wiring & Short Circuit', 'MCB Box Repair', 'Inverter Setup', 'Light & Chandelier Fitting'], required: true, order: 2 },
      { key: 'toolsCarried', label: 'Tools & Safety Equipment', type: 'text', helpText: 'e.g. Multimeter, Drill Machine, Safety Gloves', order: 3 },
      { key: 'emergencyAvailable', label: 'Emergency 24x7 Available', type: 'toggle', order: 4 },
    ]
  },
  {
    id: '14',
    title: 'Plumber Booking',
    icon: FiDroplet,
    badge: 'Popular',
    vendorFormSchema: [
      { key: 'experienceYears', label: 'Years of Experience', type: 'number', required: true, order: 1 },
      { key: 'services', label: 'Services Offered', type: 'multiselect', options: ['Tap & Mixer Repair', 'Pipe Leakage Fix', 'Toilet Repair & Fitting', 'Water Tank Cleaning', 'Drainage Cleaning', 'Geyser Installation'], required: true, order: 2 },
      { key: 'toolsCarried', label: 'Tools Carried', type: 'text', order: 3 },
      { key: 'emergencyAvailable', label: 'Emergency Available', type: 'toggle', order: 4 },
    ]
  },
  {
    id: '15',
    title: 'AC, Refrigerator, Washing Machine & RO Service Booking',
    icon: FiWind,
    badge: 'Popular',
    vendorFormSchema: [
      { key: 'experienceYears', label: 'Years of Experience', type: 'number', required: true, order: 1 },
      { key: 'applianceTypes', label: 'Appliances Serviced', type: 'multiselect', options: ['AC (Split/Window)', 'Refrigerator', 'Washing Machine', 'RO Water Purifier', 'Microwave', 'Geyser'], required: true, order: 2 },
      { key: 'acServices', label: 'AC & Appliance Services', type: 'multiselect', options: ['Installation/Uninstallation', 'Gas Filling', 'Repair & PCB', 'Deep Foam Cleaning', 'Filter Replacement'], order: 3 },
      { key: 'warrantyOffered', label: 'Service Warranty', type: 'select', options: ['7 Days', '15 Days', '30 Days', '90 Days'], order: 4 },
    ]
  },
  {
    id: '16',
    title: 'Pest Control Booking',
    icon: FiCrosshair,
    badge: 'Herbal & Chemical',
    vendorFormSchema: [
      { key: 'experienceYears', label: 'Years of Experience', type: 'number', required: true, order: 1 },
      { key: 'pestTypes', label: 'Pests Treated', type: 'multiselect', options: ['Cockroaches', 'Termites', 'Mosquitoes', 'Bed Bugs', 'Ants', 'Rodents'], required: true, order: 2 },
      { key: 'treatmentMethods', label: 'Treatment Methods', type: 'multiselect', options: ['Herbal / Organic Gel', 'Chemical Spray', 'Termite Treatment', 'Fumigation'], required: true, order: 3 },
    ]
  },
];

const SIGNUP_STORAGE_KEY = 'zevygo_vendor_signup_state';

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

  const [stepIndex, setStepIndex] = useState(savedState?.stepIndex ?? 0); // 0 Info, 1 KYC, 2 Services, 3 Bank, 4 OTP
  const [providerType] = useState('INDIVIDUAL');
  const [categories, setCategories] = useState(ALL_16_CATEGORIES);

  // Multi-Service selection array
  const [selectedServices, setSelectedServices] = useState(savedState?.selectedServices || ['Electrician Booking']);
  const [activeTabCategory, setActiveTabCategory] = useState(savedState?.activeTabCategory || 'Electrician Booking');

  // Service Specific Form Answers map
  const [serviceDetailsMap, setServiceDetailsMap] = useState(savedState?.serviceDetailsMap || {
    'Electrician Booking': { basePrice: '299', visitingCharge: '99', labourCharge: '150', emergencyCharge: '100', experienceYears: '3', tools: 'Multimeter, Drill, Safety Kit' },
  });

  const [formData, setFormData] = useState(savedState?.formData || {
    name: '',
    email: '',
    phoneNumber: '',
    gender: 'Male',
    fullAddress: '',
    city: '',
    state: '',
    pincode: '',
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
            const fallbackCat = ALL_16_CATEGORIES.find((def) => {
              const dLow = def.title.toLowerCase().trim();
              const cLow = c.title.toLowerCase().trim();
              return dLow === cLow || dLow.includes(cLow) || cLow.includes(dLow);
            }) || ALL_16_CATEGORIES[i % ALL_16_CATEGORIES.length];

            return {
              id: c._id || c.id || String(i),
              title: c.title,
              icon: fallbackCat?.icon || FiLayers,
              badge: c.homeBadge || fallbackCat?.badge || 'Available',
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
                const cleanFLow = fLow.replace(/ booking$/, '').replace(/ service$/, '');
                const cleanSLow = sLow.replace(/ booking$/, '').replace(/ service$/, '');
                return fLow === sLow || cleanFLow === cleanSLow || fLow.includes(cleanSLow) || sLow.includes(cleanFLow);
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
              const cleanFLow = fLow.replace(/ booking$/, '').replace(/ service$/, '');
              const cleanPLow = pLow.replace(/ booking$/, '').replace(/ service$/, '');
              return fLow === pLow || cleanFLow === cleanPLow || fLow.includes(cleanPLow) || pLow.includes(cleanFLow);
            });
            return matched ? matched.title : fetched[0].title;
          });
        }
      } catch (err) {
        console.warn('Using default 16 categories', err);
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
    if (otpValue.length === 6 && !isLoading && otpToken && stepIndex === 3) {
      handleOtpSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  // Toggle Category selection (Multi-select)
  const toggleCategorySelection = (catTitle) => {
    if (selectedServices.includes(catTitle)) {
      if (selectedServices.length === 1) {
        toast.error('Please select at least 1 service category');
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
    const lower = catTitle.toLowerCase();
    if (lower.includes('driver')) {
      return { drivingLicense: '', licenseType: 'LMV Commercial', experienceYears: '3', vehicleTypes: 'Sedan, SUV', hourlyRate: '150', dailyRate: '1200' };
    } else if (lower.includes('room') || lower.includes('rental') || lower.includes('hall')) {
      return { propertyName: '', roomType: 'Furnished AC Room', monthlyRent: '8500', securityDeposit: '10000', amenities: 'Wi-Fi, AC, Parking, RO Water' };
    } else if (lower.includes('photo') || lower.includes('dj') || lower.includes('makeup')) {
      return { specialty: 'Event & Shoot', equipment: 'Camera Kit / Drone', halfDayRate: '3500', fullDayRate: '7000', portfolioLink: '' };
    } else if (lower.includes('cook') || lower.includes('tiffin')) {
      return { cuisine: 'North Indian & Gujarati', dietType: 'Pure Veg', perMealRate: '120', monthlyRate: '3500', experienceYears: '4' };
    } else if (lower.includes('nurse') || lower.includes('health') || lower.includes('security')) {
      return { qualification: 'Certified Caregiver', shiftType: '12 Hours Shift', perShiftRate: '800', experienceYears: '3' };
    } else {
      return { basePrice: '299', visitingCharge: '99', labourCharge: '150', emergencyCharge: '100', experienceYears: '3', tools: 'Standard Repair Kit' };
    }
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
        pincode: formData.pincode
      },
      aadhar: formData.aadhar,
      pan: formData.pan,
      service: [],
      serviceDetails: {},
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

    // No ID photo upload required - simple verification
    setStepIndex(2);
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
          setStepIndex(4);
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
        setStepIndex(3);
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
        setStepIndex(4);
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
    'Bank Account & Payout Setup',
    'Verify Mobile Phone Number',
    'Application Submitted Successfully',
  ];

  const subtitles = [
    'Enter your name, contact, and address details',
    'Enter your Aadhaar & PAN card details for verification',
    'Enter bank details to receive job payouts directly',
    `Enter the 6-digit code sent to +91 ${formData.phoneNumber}`,
    'Your provider account is under review by Zevygo admin team',
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
          label="Base Service Price (₹) *"
          type="number"
          value={details.basePrice || '299'}
          onChange={(e) => updateServiceDetailField(catTitle, 'basePrice', e.target.value)}
          placeholder="299"
        />
        <Input
          label="Visiting Charge (₹)"
          type="number"
          value={details.visitingCharge || '99'}
          onChange={(e) => updateServiceDetailField(catTitle, 'visitingCharge', e.target.value)}
          placeholder="99"
        />
        <Input
          label="Years of Experience *"
          type="number"
          value={details.experienceYears || '3'}
          onChange={(e) => updateServiceDetailField(catTitle, 'experienceYears', e.target.value)}
          placeholder="3"
        />
        <Input
          label="Tools & Equipment Carried"
          value={details.tools || ''}
          onChange={(e) => updateServiceDetailField(catTitle, 'tools', e.target.value)}
          placeholder="e.g. Multimeter, Drill Machine, Safety Kit"
        />
      </div>
    );
  };

  return (
    <AuthShell
      maxWidth="2xl"
      onBack={stepIndex === 0 ? () => navigate('/vendor/login') : () => setStepIndex((p) => p - 1)}
      title={titles[stepIndex]}
      subtitle={subtitles[stepIndex]}
      footer={
        <p className="text-sm text-neutral-500">
          Already a partner?{' '}
          <Link to="/vendor/login" className="text-primary-500 font-semibold hover:underline">
            Login here
          </Link>
        </p>
      }
    >
      <StepIndicator steps={STEPS} current={stepIndex} className="mb-6" />

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

          <Input
            label="Street Address / Location *"
            leftIcon={FiMapPin}
            value={formData.fullAddress}
            onChange={(e) => setFormData((p) => ({ ...p, fullAddress: e.target.value }))}
            placeholder="Shop / House No, Street, Landmark"
          />

          <Input
            label="City *"
            value={formData.city}
            onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
            placeholder="e.g. Indore"
          />

          <Input
            label="State *"
            value={formData.state}
            onChange={(e) => setFormData((p) => ({ ...p, state: e.target.value }))}
            placeholder="e.g. Madhya Pradesh"
          />

          <Input
            label="Pincode *"
            value={formData.pincode}
            onChange={(e) => setFormData((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
            placeholder="e.g. 452001"
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
              Continue to Bank Details
            </Button>
          </div>
        </div>
      )}



      {/* STEP 2 — Bank Account & Payout Setup */}
      {stepIndex === 2 && (
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
              <Button type="button" variant="outline" size="xl" onClick={() => setStepIndex(1)}>
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

      {/* STEP 3 — Phone OTP Verification */}
      {stepIndex === 3 && (
        <form onSubmit={handleOtpSubmit} className="space-y-6 max-w-md mx-auto">
          <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setStepIndex(2)}
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

      {/* STEP 4 — Application Submitted Success Screen */}
      {stepIndex === 4 && (
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
