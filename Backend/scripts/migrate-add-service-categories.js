const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const connectDB = require('../config/db');
const Category = require('../models/Category');

dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Migration Script: Seed/Update 16 Core Service Categories
 * 
 * Configures all 16 categories with supportedBookingTypes, stubbed formSchema,
 * and allowMultiSelect settings.
 */
const categoriesToSeed = [
  {
    title: 'Driver',
    slug: 'driver',
    description: 'Professional personal and commercial drivers for local and outstation trips',
    supportedBookingTypes: ['instant', 'scheduled'],
    allowMultiSelect: false,
    showOnHome: true,
    homeOrder: 1
  },
  {
    title: 'Cook/Maharaj',
    slug: 'cook-maharaj',
    description: 'Expert cooks and traditional maharajs for daily meals or special events',
    supportedBookingTypes: ['instant', 'scheduled'],
    allowMultiSelect: false,
    showOnHome: true,
    homeOrder: 2
  },
  {
    title: 'Worker/Helper',
    slug: 'worker-helper',
    description: 'General labor, loading/unloading, event helpers, and manual support',
    supportedBookingTypes: ['instant', 'scheduled'],
    allowMultiSelect: true, // Allows booking multiple helpers
    showOnHome: true,
    homeOrder: 3
  },
  {
    title: 'Tiffin Service',
    slug: 'tiffin',
    description: 'Healthy home-style meal subscription and bulk tiffin delivery',
    supportedBookingTypes: ['scheduled'],
    allowMultiSelect: false,
    showOnHome: true,
    homeOrder: 4
  },
  {
    title: 'DJ & Sound System',
    slug: 'dj-sound',
    description: 'Professional DJ setups, sound systems, lights for parties and events',
    supportedBookingTypes: ['scheduled'],
    allowMultiSelect: false,
    showOnHome: true,
    homeOrder: 5
  },
  {
    title: 'Photographer & Videographer',
    slug: 'photographer-videographer',
    description: 'Event coverage, portraits, shoot sessions, and wedding photography',
    supportedBookingTypes: ['scheduled'],
    allowMultiSelect: false,
    showOnHome: true,
    homeOrder: 6
  },
  {
    title: 'Makeup Artist',
    slug: 'makeup-artist',
    description: 'Bridal, party, and casual makeup artists at your doorstep',
    supportedBookingTypes: ['instant', 'scheduled'],
    allowMultiSelect: false,
    showOnHome: true,
    homeOrder: 7
  },
  {
    title: 'Healthcare & Nursing',
    slug: 'healthcare-nurse-attendant',
    description: 'In-home nursing, elderly care, patient attendants, and physiotherapy',
    supportedBookingTypes: ['instant', 'scheduled'],
    allowMultiSelect: false,
    showOnHome: true,
    homeOrder: 8
  },
  {
    title: 'Room Rental',
    slug: 'room-rental',
    description: 'Find rooms, PGs, and apartments for short and long-term stay',
    supportedBookingTypes: ['scheduled'],
    allowMultiSelect: false,
    showOnHome: true,
    homeOrder: 9
  },
  {
    title: 'Marriage Hall & Venue',
    slug: 'marriage-hall',
    description: 'Banquet halls, marriage lawns, and event venue bookings',
    supportedBookingTypes: ['scheduled'],
    allowMultiSelect: false,
    showOnHome: true,
    homeOrder: 10
  },
  {
    title: 'Security Guard',
    slug: 'security-guard',
    description: 'Security guards, bouncers, and venue security personnel',
    supportedBookingTypes: ['instant', 'scheduled'],
    allowMultiSelect: true,
    showOnHome: true,
    homeOrder: 11
  },
  {
    title: 'Housekeeping',
    slug: 'housekeeping',
    description: 'Home deep cleaning, office maintenance, and housekeeping staff',
    supportedBookingTypes: ['instant', 'scheduled'],
    allowMultiSelect: false,
    showOnHome: true,
    homeOrder: 12
  },
  {
    title: 'Electrician',
    slug: 'electrician',
    description: 'Electrical repairs, wiring, appliance installation, and safety checks',
    supportedBookingTypes: ['instant', 'scheduled'],
    allowMultiSelect: false,
    showOnHome: true,
    homeOrder: 13
  },
  {
    title: 'Plumber',
    slug: 'plumber',
    description: 'Pipe repairs, leakage fixes, bathroom fittings, and drain cleaning',
    supportedBookingTypes: ['instant', 'scheduled'],
    allowMultiSelect: false,
    showOnHome: true,
    homeOrder: 14
  },
  {
    title: 'Appliance Service',
    slug: 'appliance-service',
    description: 'Repair and service for AC, Refrigerator, Washing Machine, RO Water Purifier',
    supportedBookingTypes: ['instant', 'scheduled'],
    allowMultiSelect: false,
    showOnHome: true,
    homeOrder: 15
  },
  {
    title: 'Pest Control',
    slug: 'pest-control',
    description: 'Termite treatment, cockroach control, bedbug treatment, and disinfection',
    supportedBookingTypes: ['scheduled'],
    allowMultiSelect: false,
    showOnHome: true,
    homeOrder: 16
  }
];

// Placeholder formSchema stub for initial safe execution
const defaultFormSchemaStub = [
  {
    key: 'notes',
    label: 'Additional notes',
    type: 'textarea',
    required: false,
    helpText: 'Provide any extra requirements or instructions',
    order: 1
  }
];

const migrateServiceCategories = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    console.log('🚀 Migrating / Seeding 16 Service Categories...');
    let successCount = 0;

    for (const catData of categoriesToSeed) {
      const payload = {
        title: catData.title,
        slug: catData.slug,
        description: catData.description,
        supportedBookingTypes: catData.supportedBookingTypes,
        allowMultiSelect: catData.allowMultiSelect,
        showOnHome: catData.showOnHome,
        homeOrder: catData.homeOrder,
        formSchema: defaultFormSchemaStub
      };

      const updatedCategory = await Category.findOneAndUpdate(
        { $or: [{ slug: catData.slug }, { title: catData.title }] },
        { $set: payload },
        { upsert: true, new: true, runValidators: true }
      );

      console.log(`  ✓ [${updatedCategory.title}] (slug: ${updatedCategory.slug}) updated successfully.`);
      successCount++;
    }

    console.log(`\n🎉 Successfully processed ${successCount}/16 categories!\n`);
  } catch (error) {
    console.error('❌ Migration Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

migrateServiceCategories();
