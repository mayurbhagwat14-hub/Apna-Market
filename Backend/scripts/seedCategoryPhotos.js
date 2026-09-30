require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const categoryPhotosData = [
  {
    slug: 'shops',
    title: 'Shops',
    subtitle: 'All Stores',
    homeIconUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80',
    homeOrder: 1
  },
  {
    slug: 'clothing',
    title: 'Clothing',
    subtitle: 'Fashion & Style',
    homeIconUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&auto=format&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&auto=format&fit=crop&q=80',
    homeOrder: 2
  },
  {
    slug: 'restaurants',
    title: 'Restaurants',
    subtitle: 'Food & Drinks',
    homeIconUrl: '/tasty-food-banner.jpg',
    imageUrl: '/tasty-food-banner.jpg',
    homeOrder: 3
  },
  {
    slug: 'services',
    title: 'Services',
    subtitle: 'Home & Personal',
    homeIconUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&auto=format&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&auto=format&fit=crop&q=80',
    homeOrder: 4
  },
  {
    slug: 'beauty-care',
    title: 'Beauty & Care',
    subtitle: 'Salon & Wellness',
    homeIconUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&auto=format&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&auto=format&fit=crop&q=80',
    homeOrder: 5
  },
  {
    slug: 'electronics',
    title: 'Electronics',
    subtitle: 'Gadgets & Stores',
    homeIconUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&auto=format&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&auto=format&fit=crop&q=80',
    homeOrder: 6
  }
];

const seedCategoryPhotos = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    for (const item of categoryPhotosData) {
      const updateData = {
        subtitle: item.subtitle,
        homeIconUrl: item.homeIconUrl,
        imageUrl: item.imageUrl,
        icon: item.homeIconUrl,
        homeOrder: item.homeOrder,
        showOnHome: true,
        status: 'active'
      };

      const result = await Category.findOneAndUpdate(
        { slug: item.slug },
        { $set: updateData },
        { new: true, upsert: true }
      );

      console.log(`✅ Updated category ${item.title}: Photo set to ${item.homeIconUrl}`);
    }

    console.log('\n🎉 All category photos successfully updated in MongoDB!');
  } catch (err) {
    console.error('❌ Error updating category photos:', err);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

seedCategoryPhotos();
