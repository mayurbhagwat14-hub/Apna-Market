require('dotenv').config();
const mongoose = require('mongoose');
const HomeContent = require('../models/HomeContent');
const Category = require('../models/Category');
const City = require('../models/City');

const seedHomeBanners = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Get Indore City and all active categories
    const city = await City.findOne({ name: /Indore/i });
    const categories = await Category.find({});
    console.log(`Found city: ${city ? city.name : 'None'} and ${categories.length} categories`);

    const getCatId = (slug) => {
      const found = categories.find(c => c.slug === slug);
      return found ? found._id : null;
    };

    // 2. High-quality banners designed for Apna Market
    const bannersList = [
      {
        title: 'Tasty Food',
        highlightText: 'Near You',
        badge: 'Discover Near You',
        subtitle: 'Explore top rated restaurants and cafes around you',
        buttonText: 'Explore Cafes',
        slug: 'restaurants',
        targetCategoryId: getCatId('restaurants'),
        bgGradient: 'from-[#014033] via-[#015443] to-[#016A54]',
        imageUrl: '/tasty-food-banner.jpg',
        text: 'Tasty Food Near You - Top Cafes & Restaurants',
        order: 1,
        isActive: true
      },
      {
        title: 'Trending Style',
        highlightText: 'In Indore',
        badge: 'Festive & Fashion',
        subtitle: 'Top local boutiques, ethnic wear & latest fashion collections',
        buttonText: 'Shop Clothing',
        slug: 'clothing',
        targetCategoryId: getCatId('clothing'),
        bgGradient: 'from-[#2e0854] via-[#4c1d95] to-[#6d28d9]',
        imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80',
        text: 'Trending Fashion in Indore - Boutiques & Apparel',
        order: 2,
        isActive: true
      },
      {
        title: 'Glow & Groom',
        highlightText: 'At Best Salons',
        badge: 'Salon & Wellness',
        subtitle: 'Top rated hair stylists, spas & skin treatments near you',
        buttonText: 'Book Salon',
        slug: 'beauty-care',
        targetCategoryId: getCatId('beauty-care'),
        bgGradient: 'from-[#831843] via-[#9d174d] to-[#be185d]',
        imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
        text: 'Salon & Beauty Care - Top Stylists & Spas',
        order: 3,
        isActive: true
      },
      {
        title: 'Trusted Local',
        highlightText: 'Services',
        badge: 'Doorstep Help',
        subtitle: 'Verified electricians, plumbers & AC repair experts',
        buttonText: 'Explore Services',
        slug: 'services',
        targetCategoryId: getCatId('services'),
        bgGradient: 'from-[#064e3b] via-[#047857] to-[#059669]',
        imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80',
        text: 'Home Repair & Services - Verified Technicians',
        order: 4,
        isActive: true
      },
      {
        title: 'Neighborhood',
        highlightText: 'Stores & Kirana',
        badge: 'Apna Bazaar',
        subtitle: 'Daily essentials, fresh groceries & local shopping simplified',
        buttonText: 'Browse Stores',
        slug: 'shops',
        targetCategoryId: getCatId('shops'),
        bgGradient: 'from-[#1e3a8a] via-[#1d4ed8] to-[#2563eb]',
        imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
        text: 'Apna Bazaar - Local Stores & Daily Groceries',
        order: 5,
        isActive: true
      },
      {
        title: 'Electronics &',
        highlightText: 'Gadget Hub',
        badge: 'Best Tech Deals',
        subtitle: 'Smartphones, laptops, accessories & instant repair shops',
        buttonText: 'View Gadgets',
        slug: 'electronics',
        targetCategoryId: getCatId('electronics'),
        bgGradient: 'from-[#18181b] via-[#334155] to-[#475569]',
        imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80',
        text: 'Electronics Hub - Gadgets & Tech Repairs',
        order: 6,
        isActive: true
      }
    ];

    // Seed both Default (null cityId) and Indore City HomeContent
    const targets = [
      { cityId: null, label: 'Default (Global)' },
      ...(city ? [{ cityId: city._id, label: `City: ${city.name}` }] : [])
    ];

    for (const target of targets) {
      console.log(`\n📦 Seeding HomeContent for ${target.label}...`);
      let doc = await HomeContent.findOne({ cityId: target.cityId });
      if (!doc) {
        doc = new HomeContent({
          cityId: target.cityId,
          isBannersVisible: true,
          isActive: true
        });
      }

      doc.banners = bannersList;
      doc.isBannersVisible = true;
      doc.isActive = true;
      await doc.save();
      console.log(`✅ Saved ${doc.banners.length} banners for ${target.label}`);
    }

    console.log('\n🎉 All Apna Market banners successfully seeded into database!');
  } catch (error) {
    console.error('❌ Error seeding banners:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

seedHomeBanners();
