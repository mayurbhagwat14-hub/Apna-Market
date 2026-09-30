import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const SavedContext = createContext();

export const SavedProvider = ({ children }) => {
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const stored = localStorage.getItem('apna_market_saved_ids');
      if (stored) return JSON.parse(stored);
    } catch {
      /* ignore bad storage */
    }
    // Default initial saved businesses from reference
    return ['biz-1', 'biz-2', 'biz-3', 'biz-4'];
  });

  const [savedBusinesses, setSavedBusinesses] = useState(() => {
    try {
      const stored = localStorage.getItem('apna_market_saved_businesses');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return [
      {
        _id: 'biz-1',
        id: 'biz-1',
        title: 'Urban Threads & Ethnic',
        businessName: 'Urban Threads & Ethnic',
        categoryName: 'Fashion Boutique',
        category: 'clothing',
        rating: 4.8,
        reviewsCount: 312,
        locality: 'Vijay Nagar, Indore',
        distance: '1.2 km away',
        offer: 'Flat 20% OFF on Festive Wear',
        coverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
      },
      {
        _id: 'biz-2',
        id: 'biz-2',
        title: 'The Spice Villa & Rooftop',
        businessName: 'The Spice Villa & Rooftop',
        categoryName: 'Fine Dining & Cafe',
        category: 'restaurants',
        rating: 4.7,
        reviewsCount: 428,
        locality: 'New Palasia, Indore',
        distance: '1.8 km away',
        offer: 'Free Dessert on Bill Above ₹599',
        coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
      },
      {
        _id: 'biz-3',
        id: 'biz-3',
        title: 'Glow Luxury Salon & Spa',
        businessName: 'Glow Luxury Salon & Spa',
        categoryName: 'Salon & Wellness',
        category: 'beauty-care',
        rating: 4.9,
        reviewsCount: 194,
        locality: 'Saket Nagar, Indore',
        distance: '2.4 km away',
        offer: 'Complimentary Hair Spa with Facial',
        coverImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
        image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
      },
      {
        _id: 'biz-4',
        id: 'biz-4',
        title: 'Fresh Mart Organic Superstore',
        businessName: 'Fresh Mart Organic Superstore',
        categoryName: 'Grocery & Organic',
        category: 'shops',
        rating: 4.6,
        reviewsCount: 175,
        locality: 'Bhawarkua, Indore',
        distance: '0.8 km away',
        offer: '10% Cashback on Daily Staples',
        coverImage: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
        image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('apna_market_saved_ids', JSON.stringify(savedIds));
    } catch {}
  }, [savedIds]);

  useEffect(() => {
    try {
      localStorage.setItem('apna_market_saved_businesses', JSON.stringify(savedBusinesses));
    } catch {}
  }, [savedBusinesses]);

  const isSaved = (businessOrId) => {
    if (!businessOrId) return false;
    const id = typeof businessOrId === 'string' ? businessOrId : (businessOrId._id || businessOrId.id || businessOrId.title || businessOrId.businessName);
    const title = typeof businessOrId === 'object' ? (businessOrId.title || businessOrId.businessName) : null;
    return savedIds.includes(id) || (title && savedIds.includes(title));
  };

  const toggleSave = (business) => {
    if (!business) return;
    const id = business._id || business.id || business.title || business.businessName;
    const title = business.title || business.businessName || 'Business';

    if (isSaved(business)) {
      setSavedIds(prev => prev.filter(i => i !== id && i !== title));
      setSavedBusinesses(prev => prev.filter(b => (b._id || b.id || b.title) !== id && (b.title || b.businessName) !== title));
      toast.success(`${title} removed from Saved`, { icon: '💔' });
    } else {
      setSavedIds(prev => [...prev, id, title]);
      setSavedBusinesses(prev => {
        const exists = prev.some(b => (b._id || b.id || b.title) === id || (b.title || b.businessName) === title);
        if (exists) return prev;
        return [business, ...prev];
      });
      toast.success(`${title} saved to Favorites!`, { icon: '💚' });
    }
  };

  return (
    <SavedContext.Provider value={{ 
      savedIds, 
      savedBusinesses, 
      savedList: savedBusinesses, 
      isSaved, 
      toggleSave, 
      toggleSaved: toggleSave 
    }}>
      {children}
    </SavedContext.Provider>
  );
};

export const useSaved = () => useContext(SavedContext);
