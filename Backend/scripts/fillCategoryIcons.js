const mongoose = require('mongoose');
require('dotenv').config();
const Category = require('../models/Category');

const categoryIcons = {
  'ac': 'https://res.cloudinary.com/homster/image/upload/v1769683941/Homster/ac/icons/tk2xrdvdsus6jkosfb4i.png',
  'cooler': 'https://res.cloudinary.com/homster/image/upload/v1769685067/Homster/cooler/icons/ke79k2kvdgnbxwxstdx5.png',
  'washing-machine': 'https://res.cloudinary.com/homster/image/upload/v1769685245/Homster/washing-machine/icons/esgtn3u9z7fqtpigru1d.png',
  'ro-prufier': 'https://res.cloudinary.com/homster/image/upload/v1769684289/Homster/ro-prufier/icons/mr1vqanmihs4hevkgp4j.png',
  'geyser': 'https://res.cloudinary.com/homster/image/upload/v1769684698/Homster/geyser/icons/ckf49o00jstnnbwocwii.png',
  'microwave': 'https://res.cloudinary.com/homster/image/upload/v1769684598/Homster/microwave/icons/lghp7lxengfdpwrxbeui.png',
  'led': 'https://res.cloudinary.com/homster/image/upload/v1769685520/Homster/led/icons/zpyfpoqziexhtnc0zdyk.png',
  'fridge': 'https://res.cloudinary.com/homster/image/upload/v1769684140/Homster/fridge/icons/wnittfzob1u5mjonqcak.png',
  'kitchen-chimney': 'https://res.cloudinary.com/homster/image/upload/v1769703475/Homster/kitchen-chimni/icons/ztaypgpz4zhjlkd1m0dq.png',
  'dish-washer': 'https://res.cloudinary.com/homster/image/upload/v1771493785/Homster/dish-washer/icons/skh0c7yv8srvljzjfxhl.png',
  'atm-e-surveillance-recycler': 'https://res.cloudinary.com/homster/image/upload/v1778298352/Homster/atm-e-surveillance-recycler/icons/m0klpa4zzdftm2trrnei.jpg',
  'marriage-hall': 'https://res.cloudinary.com/homster/image/upload/v1784703899/Homster/icons/cscucx4c4pkmwsgvvigj.jpg',
  'driver-booking': 'https://res.cloudinary.com/homster/image/upload/v1784703941/Homster/icons/kfvrvbzna0ypvtoxjz8w.jpg',
  'dj-booking': 'https://res.cloudinary.com/homster/image/upload/v1784703984/Homster/icons/kmcb2qntnt6bfrz7azpe.jpg',
  'driver': 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=200&auto=format&fit=crop&q=80',
  'cook-maharaj': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=200&auto=format&fit=crop&q=80',
  'worker-helper': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&auto=format&fit=crop&q=80',
  'tiffin': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80',
  'dj-sound': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80',
  'photographer-videographer': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&auto=format&fit=crop&q=80',
  'makeup-artist': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&auto=format&fit=crop&q=80',
  'healthcare-nurse-attendant': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&auto=format&fit=crop&q=80',
  'room-rental': 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&auto=format&fit=crop&q=80',
  'security-guard': 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=200&auto=format&fit=crop&q=80',
  'housekeeping': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&auto=format&fit=crop&q=80',
  'electrician': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200&auto=format&fit=crop&q=80',
  'plumber': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=200&auto=format&fit=crop&q=80',
  'appliance-service': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=200&auto=format&fit=crop&q=80',
  'pest-control': 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=200&auto=format&fit=crop&q=80'
};

async function seedIcons() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const [slug, url] of Object.entries(categoryIcons)) {
      await Category.updateMany(
        { slug },
        { $set: { homeIconUrl: url, imageUrl: url } }
      );
    }
    console.log('SUCCESSFULLY_SEEDED_ALL_CATEGORY_ICONS');
  } catch (err) {
    console.error('Error seeding category icons:', err);
  } finally {
    mongoose.disconnect();
  }
}

seedIcons();
