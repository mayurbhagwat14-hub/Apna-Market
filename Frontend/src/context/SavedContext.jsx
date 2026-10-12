import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

const SavedContext = createContext();

const STORAGE_KEY = 'apna_market_saved_businesses';
const LEGACY_IDS_KEY = 'apna_market_saved_ids';

export const SavedProvider = ({ children }) => {
  const [savedBusinesses, setSavedBusinesses] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out legacy mock dummy items (biz-1, biz-2, etc.) so user gets a real clean experience
          return parsed.filter(b => {
            const id = String(b?._id || b?.id || '');
            return !id.startsWith('biz-');
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load saved businesses from storage:', e);
    }
    // Start with empty saved list for users
    return [];
  });

  // Sync saved businesses to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedBusinesses));
      // Also update legacy IDs array for backward compatibility
      const ids = savedBusinesses.map(b => String(b._id || b.id || '')).filter(Boolean);
      localStorage.setItem(LEGACY_IDS_KEY, JSON.stringify(ids));
    } catch (e) {
      console.warn('Failed to save businesses to storage:', e);
    }
  }, [savedBusinesses]);

  // Derived list of saved IDs for fast lookups & backward compatibility
  const savedIds = useMemo(() => {
    const set = new Set();
    savedBusinesses.forEach(b => {
      if (b._id) set.add(String(b._id).toLowerCase());
      if (b.id) set.add(String(b.id).toLowerCase());
      if (b.businessName) set.add(String(b.businessName).toLowerCase());
      if (b.title) set.add(String(b.title).toLowerCase());
    });
    return Array.from(set);
  }, [savedBusinesses]);

  // Check if a business or ID is saved
  const isSaved = (businessOrId) => {
    if (!businessOrId) return false;

    // If passed a primitive ID or string
    if (typeof businessOrId === 'string' || typeof businessOrId === 'number') {
      const target = String(businessOrId).trim().toLowerCase();
      if (!target) return false;
      return savedBusinesses.some(b => {
        const bId = String(b._id || b.id || '').trim().toLowerCase();
        const bName = String(b.businessName || b.title || b.name || '').trim().toLowerCase();
        return bId === target || bName === target;
      });
    }

    // If passed a business object
    const targetId = String(businessOrId._id || businessOrId.id || '').trim().toLowerCase();
    const targetName = String(businessOrId.businessName || businessOrId.title || businessOrId.name || '').trim().toLowerCase();

    return savedBusinesses.some(b => {
      const bId = String(b._id || b.id || '').trim().toLowerCase();
      const bName = String(b.businessName || b.title || b.name || '').trim().toLowerCase();
      if (targetId && bId && bId === targetId) return true;
      if (targetName && bName && bName === targetName) return true;
      return false;
    });
  };

  // Toggle save state
  const toggleSave = (business) => {
    if (!business) return;

    // If passed a primitive string / ID to toggle
    if (typeof business === 'string' || typeof business === 'number') {
      const target = String(business).trim().toLowerCase();
      setSavedBusinesses(prev => {
        const existing = prev.find(b => {
          const bId = String(b._id || b.id || '').trim().toLowerCase();
          const bName = String(b.businessName || b.title || b.name || '').trim().toLowerCase();
          return bId === target || bName === target;
        });

        if (existing) {
          const name = existing.businessName || existing.title || existing.name || 'Business';
          toast.success(`${name} removed from Saved`, { icon: '💔' });
          return prev.filter(b => b !== existing);
        }
        return prev;
      });
      return;
    }

    const targetId = String(business._id || business.id || '').trim().toLowerCase();
    const targetName = String(business.businessName || business.title || business.name || '').trim().toLowerCase();
    const displayName = business.businessName || business.title || business.name || 'Business';

    setSavedBusinesses(prev => {
      const existingIdx = prev.findIndex(b => {
        const bId = String(b._id || b.id || '').trim().toLowerCase();
        const bName = String(b.businessName || b.title || b.name || '').trim().toLowerCase();
        if (targetId && bId && bId === targetId) return true;
        if (targetName && bName && bName === targetName) return true;
        return false;
      });

      if (existingIdx >= 0) {
        // Remove
        toast.success(`${displayName} removed from Saved`, { icon: '💔' });
        return prev.filter((_, idx) => idx !== existingIdx);
      } else {
        // Add normalized business item
        const categoryLabel =
          business.categoryName ||
          (typeof business.category === 'object'
            ? (business.category?.title || business.category?.name || business.category?.slug)
            : business.category) ||
          business.tags?.[0] ||
          'Local Business';

        const rawRating = business.dynamicFormAnswers?.rating || business.rating || business.ratingAverage || 4.7;
        const rawReviews = business.dynamicFormAnswers?.reviewCount || business.reviewsCount || business.reviewCount || 120;
        const rawDistance = business.distance ||
          (business.distanceKm !== undefined && business.distanceKm !== null && business.distanceKm !== 9999
            ? (business.distanceKm < 1 ? `${Math.round(business.distanceKm * 1000)} m` : `${business.distanceKm.toFixed(1)} km away`)
            : 'Nearby');

        const rawImage =
          business.coverImage ||
          business.image ||
          business.images?.[0] ||
          business.portfolioPhotos?.[0] ||
          business.dynamicFormAnswers?.coverImage ||
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80';

        const normalized = {
          _id: business._id || business.id || Date.now().toString(),
          id: business.id || business._id || Date.now().toString(),
          title: displayName,
          businessName: displayName,
          name: displayName,
          categoryName: categoryLabel,
          category: business.category,
          categorySlug: business.categorySlug,
          rating: typeof rawRating === 'number' ? Number(rawRating.toFixed(1)) : rawRating,
          reviewsCount: rawReviews,
          locality: business.locality || business.address || business.city || 'Indore',
          distance: rawDistance,
          coverImage: rawImage,
          image: rawImage,
          offer: business.offer || business.dynamicFormAnswers?.offer || null,
          savedAt: Date.now()
        };

        toast.success(`${displayName} saved to Favorites!`, { icon: '💚' });
        return [normalized, ...prev];
      }
    });
  };

  const clearSaved = () => {
    setSavedBusinesses([]);
    toast.success('Saved places cleared');
  };

  return (
    <SavedContext.Provider value={{
      savedIds,
      savedBusinesses,
      savedList: savedBusinesses,
      isSaved,
      toggleSave,
      toggleSaved: toggleSave,
      clearSaved
    }}>
      {children}
    </SavedContext.Provider>
  );
};

export const useSaved = () => useContext(SavedContext);
