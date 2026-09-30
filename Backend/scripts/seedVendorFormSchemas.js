require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Category = require('../models/Category');

const schemasData = [
  {
    slug: 'shops',
    title: 'Shops',
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
    slug: 'clothing',
    title: 'Clothing',
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
    slug: 'restaurants',
    title: 'Restaurants',
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
    slug: 'services',
    title: 'Services',
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
    slug: 'beauty-care',
    title: 'Beauty & Care',
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
    slug: 'electronics',
    title: 'Electronics',
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

async function seedVendorFormSchemas() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    for (const item of schemasData) {
      const filter = {
        $or: [
          { slug: item.slug },
          { title: new RegExp(`^${item.title}$`, 'i') }
        ]
      };

      const existing = await Category.findOne(filter);
      if (existing) {
        existing.vendorFormSchema = item.vendorFormSchema;
        await existing.save();
        console.log(`✅ Updated vendorFormSchema for category: "${existing.title}" (${item.vendorFormSchema.length} fields)`);
      } else {
        console.log(`⚠️ Category not found for slug/title: ${item.slug} / ${item.title}`);
      }
    }

    console.log('\nAll category vendorFormSchemas successfully seeded!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding vendor form schemas:', error);
    process.exit(1);
  }
}

seedVendorFormSchemas();
