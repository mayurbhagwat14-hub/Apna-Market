require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Vendor = require('../models/Vendor');
const ServiceListing = require('../models/ServiceListing');
const City = require('../models/City');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Ensure Indore City exists
    let city = await City.findOne({ name: /Indore/i });
    if (!city) {
      city = await City.create({
        name: 'Indore',
        state: 'Madhya Pradesh',
        status: 'active',
        coordinates: { lat: 22.7196, lng: 75.8577 },
        isDefault: true
      });
      console.log('Created city: Indore');
    }

    // 2. Categories matching the reference design
    const categoriesData = [
      {
        title: 'Shops',
        name: 'Shops',
        subtitle: 'All Stores',
        slug: 'shops',
        icon: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80',
        homeIconUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80',
        imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80',
        color: '#3B82F6',
        bgLight: '#EFF6FF',
        order: 1,
        status: 'active',
        cityId: city._id
      },
      {
        title: 'Clothing',
        name: 'Clothing',
        subtitle: 'Fashion & Style',
        slug: 'clothing',
        icon: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&auto=format&fit=crop&q=80',
        homeIconUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&auto=format&fit=crop&q=80',
        imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&auto=format&fit=crop&q=80',
        color: '#8B5CF6',
        bgLight: '#F5F3FF',
        order: 2,
        status: 'active',
        cityId: city._id
      },
      {
        title: 'Restaurants',
        name: 'Restaurants',
        subtitle: 'Food & Drinks',
        slug: 'restaurants',
        icon: '/tasty-food-banner.jpg',
        homeIconUrl: '/tasty-food-banner.jpg',
        imageUrl: '/tasty-food-banner.jpg',
        color: '#F97316',
        bgLight: '#FFF7ED',
        order: 3,
        status: 'active',
        cityId: city._id
      },
      {
        title: 'Services',
        name: 'Services',
        subtitle: 'Home & Personal',
        slug: 'services',
        icon: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&auto=format&fit=crop&q=80',
        homeIconUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&auto=format&fit=crop&q=80',
        imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&auto=format&fit=crop&q=80',
        color: '#016A54',
        bgLight: '#EDF8F5',
        order: 4,
        status: 'active',
        cityId: city._id
      },
      {
        title: 'Beauty & Care',
        name: 'Beauty & Care',
        subtitle: 'Salon & Wellness',
        slug: 'beauty-care',
        icon: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&auto=format&fit=crop&q=80',
        homeIconUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&auto=format&fit=crop&q=80',
        imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&auto=format&fit=crop&q=80',
        color: '#EC4899',
        bgLight: '#FDF2F8',
        order: 5,
        status: 'active',
        cityId: city._id
      },
      {
        title: 'Electronics',
        name: 'Electronics',
        subtitle: 'Gadgets & Stores',
        slug: 'electronics',
        icon: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&auto=format&fit=crop&q=80',
        homeIconUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&auto=format&fit=crop&q=80',
        imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&auto=format&fit=crop&q=80',
        color: '#64748B',
        bgLight: '#F8FAFC',
        order: 6,
        status: 'active',
        cityId: city._id
      }
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      let doc = await Category.findOne({ slug: cat.slug });
      if (!doc) {
        doc = await Category.create(cat);
        console.log(`Created category: ${cat.title}`);
      } else {
        await Category.updateOne({ _id: doc._id }, { $set: cat });
      }
      categoryMap[cat.slug] = doc;
    }

    // 3. Businesses matching the reference design
    const businesses = [
      {
        businessName: 'The Urban Table',
        categorySlug: 'restaurants',
        categoryName: 'Restaurants',
        tagline: 'Cozy modern restaurant with artisanal food & beverages',
        rating: 4.6,
        reviewCount: 310,
        distance: '1.5 km',
        phone: '+91 98765 43210',
        address: '54, Scheme No 54, Vijay Nagar, Indore, MP',
        lat: 22.7533,
        lng: 75.8937,
        openStatus: 'Open Now • 10:00 AM - 11:00 PM',
        deliveryInfo: 'Delivery Available • Within 3 km',
        tags: ['Dine-in', 'Takeaway', 'Outdoor Seating'],
        coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&auto=format&fit=crop&q=80'
        ],
        offer: {
          title: '20% OFF on selected items',
          code: 'URBAN20',
          badge: '20% OFF',
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'
        },
        catalog: [
          { name: 'Paneer Tikka Platter', price: 280, category: 'Starters', desc: 'Smoky grilled cottage cheese cubes with mint dip' },
          { name: 'Artisan Woodfire Pizza', price: 420, category: 'Mains', desc: 'Fresh mozzarella, basil and hand-crushed tomatoes' },
          { name: 'Cold Brew Hazelnut', price: 180, category: 'Beverages', desc: 'Slow steeped cold coffee with roasted hazelnut' },
          { name: 'Chocolate Lava Truffle', price: 210, category: 'Desserts', desc: 'Molten Belgian chocolate center with vanilla bean gelato' }
        ]
      },
      {
        businessName: 'Zudio Fashions',
        categorySlug: 'clothing',
        categoryName: 'Clothing',
        tagline: 'Trendy affordable fashion for Men, Women & Kids',
        rating: 4.5,
        reviewCount: 482,
        distance: '1.2 km',
        phone: '+91 98234 11223',
        address: 'Treasure Island Mall, MG Road, Indore, MP',
        lat: 22.7212,
        lng: 75.8770,
        openStatus: 'Open Now • 10:30 AM - 9:30 PM',
        deliveryInfo: 'Store Pickup Available',
        tags: ['Men', 'Women', 'Kids', 'Footwear'],
        coverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=200&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&auto=format&fit=crop&q=80'
        ],
        offer: {
          title: 'Buy 2 Get 1 Free on Graphic Tees',
          code: 'TEEFEST',
          badge: 'B2G1 FREE',
          image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80'
        },
        catalog: [
          { name: 'Oversized Cotton Tee', price: 399, category: 'Men', desc: '100% breathable organic combed cotton' },
          { name: 'Relaxed Fit Cargo Pants', price: 899, category: 'Men', desc: 'Utility pockets with stretch waistband' },
          { name: 'Floral Summer Dress', price: 699, category: 'Women', desc: 'Lightweight flowy chiffon dress' }
        ]
      },
      {
        businessName: 'Urban Threads',
        categorySlug: 'clothing',
        categoryName: 'Clothing',
        tagline: 'Curated premium boutique & streetwear fashion',
        rating: 4.7,
        reviewCount: 256,
        distance: '1.2 km',
        phone: '+91 97112 33445',
        address: '12, New Palasia, Indore, MP',
        lat: 22.7275,
        lng: 75.8820,
        openStatus: 'Open Now • 11:00 AM - 10:00 PM',
        deliveryInfo: 'Express Delivery in 2 Hours',
        tags: ['Designer Wear', 'Denim', 'Boutique'],
        coverImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80'
        ],
        offer: {
          title: 'Flat 15% OFF on New Arrivals',
          code: 'URBAN15',
          badge: '15% OFF',
          image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&auto=format&fit=crop&q=80'
        },
        catalog: [
          { name: 'Handcrafted Denim Jacket', price: 1499, category: 'Jackets', desc: 'Vintage wash with custom metal buttons' },
          { name: 'Textured Linen Shirt', price: 999, category: 'Shirts', desc: 'Premium European linen fabric' }
        ]
      },
      {
        businessName: 'Spice Villa',
        categorySlug: 'restaurants',
        categoryName: 'Restaurants',
        tagline: 'Authentic royal North Indian cuisine & fine dining',
        rating: 4.6,
        reviewCount: 189,
        distance: '0.8 km',
        phone: '+91 98930 55667',
        address: 'Bhawarkua Main Road, Indore, MP',
        lat: 22.6950,
        lng: 75.8650,
        openStatus: 'Open Now • 11:30 AM - 11:30 PM',
        deliveryInfo: 'Fast Delivery in 30 Mins',
        tags: ['North Indian', 'Biryani', 'Family Dining'],
        coverImage: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80'
        ],
        offer: {
          title: 'Free Dessert on orders above ₹500',
          code: 'SWEET500',
          badge: 'FREE GIFT',
          image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&auto=format&fit=crop&q=80'
        },
        catalog: [
          { name: 'Dum Handi Biryani', price: 340, category: 'Biryani', desc: 'Fragrant basmati rice slow cooked in sealed clay pot' },
          { name: 'Dal Makhani Bukhara', price: 260, category: 'Curries', desc: 'Slow cooked overnight with white butter and cream' }
        ]
      },
      {
        businessName: 'Glow Studio',
        categorySlug: 'beauty-care',
        categoryName: 'Beauty & Care',
        tagline: 'Luxury unisex salon, rejuvenating spa & hair styling',
        rating: 4.8,
        reviewCount: 423,
        distance: '2.8 km',
        phone: '+91 97555 88990',
        address: 'C21 Mall Road, Vijay Nagar, Indore, MP',
        lat: 22.7510,
        lng: 75.8900,
        openStatus: 'Open Now • 10:00 AM - 8:30 PM',
        deliveryInfo: 'Home Service Available',
        tags: ['Hair Styling', 'Facial & Spa', 'Nail Bar'],
        coverImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80'
        ],
        offer: {
          title: '30% OFF on Hair Spa + Cut Combo',
          code: 'GLOW30',
          badge: '30% OFF',
          image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&auto=format&fit=crop&q=80'
        },
        catalog: [
          { name: 'L’Oréal Moroccan Hair Spa', price: 899, category: 'Hair', desc: 'Intensive moisture therapy for silky smooth hair' },
          { name: 'Hydra Glow Deep Facial', price: 1299, category: 'Skin', desc: 'Multi-step skin hydration & exfoliation' }
        ]
      },
      {
        businessName: 'TechZone',
        categorySlug: 'electronics',
        categoryName: 'Electronics',
        tagline: 'Smartphones, Laptops, Audio Gear & Instant Repairs',
        rating: 4.3,
        reviewCount: 176,
        distance: '2.4 km',
        phone: '+91 98270 44556',
        address: 'Silver Mall, RNT Marg, Indore, MP',
        lat: 22.7160,
        lng: 75.8710,
        openStatus: 'Open Now • 11:00 AM - 9:00 PM',
        deliveryInfo: 'Same Day Delivery Across Indore',
        tags: ['Smartphones', 'Audio', 'Laptops', 'Repairs'],
        coverImage: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
        ],
        offer: {
          title: 'Extra ₹1000 OFF on Laptops & Tablets',
          code: 'TECH1000',
          badge: 'SAVE ₹1000',
          image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&auto=format&fit=crop&q=80'
        },
        catalog: [
          { name: 'ANC Wireless Headphones', price: 2499, category: 'Audio', desc: 'Active noise cancellation with 40-hour battery' },
          { name: 'GaN 65W Fast Charger', price: 999, category: 'Accessories', desc: 'Ultra compact triple port USB-C fast charger' }
        ]
      },
      {
        businessName: 'SmartCare Services',
        categorySlug: 'services',
        categoryName: 'Services',
        tagline: 'Trusted certified technicians for home appliances & repairs',
        rating: 4.7,
        reviewCount: 261,
        distance: '3.1 km',
        phone: '+91 98260 77889',
        address: 'Sapna Sangeeta Road, Indore, MP',
        lat: 22.7050,
        lng: 75.8750,
        openStatus: 'Open Now • 8:00 AM - 9:00 PM',
        deliveryInfo: 'Technician arrives in 45 mins',
        tags: ['AC Repair', 'Plumbing', 'Electrical', 'Appliances'],
        coverImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80'
        ],
        offer: {
          title: 'AC Complete Service at just ₹499',
          code: 'ACCOOL',
          badge: 'SPECIAL',
          image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80'
        },
        catalog: [
          { name: 'Split AC Deep Clean Service', price: 499, category: 'AC', desc: 'Foam jet wash, filter cleaning and cooling check' },
          { name: 'Electrical Safety Inspection', price: 299, category: 'Electrical', desc: 'Complete home wiring, MCB & earthing test' }
        ]
      },
      {
        businessName: 'StyleNest',
        categorySlug: 'clothing',
        categoryName: 'Clothing',
        tagline: 'Modern ethnic suits, sarees & festive collections',
        rating: 4.4,
        reviewCount: 189,
        distance: '1.8 km',
        phone: '+91 97520 66778',
        address: 'Sarafa Bazar, Indore, MP',
        lat: 22.7190,
        lng: 75.8560,
        openStatus: 'Open Now • 11:00 AM - 9:00 PM',
        deliveryInfo: 'Custom Stitching Available',
        tags: ['Ethnic', 'Sarees', 'Festive'],
        coverImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80'
        ],
        offer: null,
        catalog: [
          { name: 'Chanderi Silk Anarkali Suit', price: 2499, category: 'Suits', desc: 'Handblock printed with zari dupatta' }
        ]
      },
      {
        businessName: 'Trendy Wear',
        categorySlug: 'clothing',
        categoryName: 'Clothing',
        tagline: 'Casual everyday college & workwear fashion',
        rating: 4.6,
        reviewCount: 230,
        distance: '2.1 km',
        phone: '+91 98261 22334',
        address: 'South Tukoganj, Indore, MP',
        lat: 22.7230,
        lng: 75.8790,
        openStatus: 'Open Now • 10:30 AM - 9:30 PM',
        deliveryInfo: 'Store Pickup Available',
        tags: ['Casual', 'Denim', 'Shirts'],
        coverImage: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=200&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=800&auto=format&fit=crop&q=80'
        ],
        offer: null,
        catalog: [
          { name: 'Slim Fit Chino Trousers', price: 899, category: 'Trousers', desc: '4-way stretch twill cotton chinos' }
        ]
      },
      {
        businessName: 'Fashion Hub',
        categorySlug: 'clothing',
        categoryName: 'Clothing',
        tagline: 'Family apparel store with top brand varieties',
        rating: 4.3,
        reviewCount: 142,
        distance: '2.8 km',
        phone: '+91 98265 99001',
        address: 'Malhar Mega Mall, AB Road, Indore, MP',
        lat: 22.7540,
        lng: 75.8970,
        openStatus: 'Open Now • 11:00 AM - 10:00 PM',
        deliveryInfo: 'Delivery in 24 Hours',
        tags: ['Apparel', 'Family', 'Footwear'],
        coverImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop&q=80'
        ],
        offer: null,
        catalog: [
          { name: 'Classic Polo Shirt', price: 599, category: 'Polo', desc: 'Honeycomb breathable cotton knit' }
        ]
      }
    ];

    for (const b of businesses) {
      const cat = categoryMap[b.categorySlug];
      if (!cat) continue;

      // 1. Create or update vendor
      const email = `${b.businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}@apnamarket.local`;
      const phone = b.phone.replace(/[^0-9]/g, '').slice(-10);

      let vendor = await Vendor.findOne({ businessName: b.businessName });
      if (!vendor) {
        vendor = await Vendor.create({
          name: b.businessName,
          businessName: b.businessName,
          email: email,
          phone: phone,
          role: 'vendor',
          accountStatus: 'ACTIVE',
          approvalStatus: 'approved',
          isAvailableNow: true,
          profilePhoto: b.logo,
          aadhar: {
            number: '12345678' + Math.floor(1000 + Math.random() * 9000),
            document: b.logo,
            backDocument: b.logo
          },
          pan: {
            number: 'ABCDE' + Math.floor(1000 + Math.random() * 9000) + 'F',
            document: b.logo
          },
          address: {
            fullAddress: b.address,
            city: 'Indore',
            state: 'Madhya Pradesh',
            lat: b.lat,
            lng: b.lng
          },
          businessDetails: {
            businessName: b.businessName,
            businessLogo: b.logo,
            businessDescription: b.tagline,
            businessAddress: b.address
          }
        });
        console.log(`Created vendor: ${b.businessName}`);
      } else {
        await Vendor.updateOne({ _id: vendor._id }, {
          $set: {
            profilePhoto: b.logo,
            'address.lat': b.lat,
            'address.lng': b.lng,
            'address.fullAddress': b.address,
            'address.city': 'Indore',
            accountStatus: 'ACTIVE',
            approvalStatus: 'approved'
          }
        });
      }

      // 2. Create or update service listing
      let listing = await ServiceListing.findOne({ vendorId: vendor._id, categoryId: cat._id });
      const listingData = {
        vendorId: vendor._id,
        categoryId: cat._id,
        categoryName: cat.title,
        title: b.businessName,
        description: b.tagline,
        shortDescription: b.tagline,
        status: 'APPROVED',
        portfolioPhotos: b.photos,
        catalogItems: b.catalog,
        serviceArea: {
          city: 'Indore',
          radiusKm: 15
        },
        pricing: {
          basePrice: b.catalog[0]?.price || 199
        },
        dynamicFormAnswers: {
          rating: b.rating,
          reviewCount: b.reviewCount,
          distance: b.distance,
          openStatus: b.openStatus,
          deliveryInfo: b.deliveryInfo,
          tags: b.tags,
          offer: b.offer,
          coverImage: b.coverImage,
          logo: b.logo,
          lat: b.lat,
          lng: b.lng,
          address: b.address,
          phone: b.phone
        }
      };

      if (!listing) {
        await ServiceListing.create(listingData);
        console.log(`Created listing: ${b.businessName} (${cat.title})`);
      } else {
        await ServiceListing.updateOne({ _id: listing._id }, { $set: listingData });
      }
    }

    console.log('\n✅ Successfully seeded Apna Market categories, vendors and listings!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
};

seedData();
