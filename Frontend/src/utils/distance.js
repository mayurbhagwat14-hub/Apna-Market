/**
 * Distance & Proximity Utilities for Apna Market
 * Calculates Haversine distance between customer location and shops.
 */

export const DEFAULT_USER_LOCATION = {
  lat: 22.7196,
  lng: 75.8577,
  cityName: 'Indore',
  addressName: 'Indore, Madhya Pradesh',
  source: 'default'
};

/**
 * Calculates straight-line distance in kilometers between two geo coordinates
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null
  ) {
    return null;
  }

  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
    return null;
  }

  const R = 6371; // Earth radius in kilometers
  const dLat = (nLat2 - nLat1) * (Math.PI / 180);
  const dLon = (nLon2 - nLon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(nLat1 * (Math.PI / 180)) *
    Math.cos(nLat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 10) / 10;
};

/**
 * Formats a distance in km into a human-friendly label (e.g., "350 m" or "1.4 km")
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return 'Nearby';
  }

  const num = Number(distanceKm);
  if (num < 0.1) return 'Within 100 m';
  if (num < 1) return `${Math.round(num * 1000)} m`;
  return `${num.toFixed(1)} km`;
};

/**
 * Augments a list of shops with calculated real distance from userLocation and sorts nearest first.
 */
export const sortShopsByProximity = (shops = [], userLocation = DEFAULT_USER_LOCATION) => {
  if (!Array.isArray(shops) || shops.length === 0) return [];

  const uLat = userLocation?.lat;
  const uLng = userLocation?.lng;

  const processed = shops.map((shop) => {
    // If shop already has precalculated distance from backend
    if (shop.distanceKm !== undefined && shop.distanceKm !== null && shop.distance) {
      return {
        ...shop,
        distanceKm: shop.distanceKm,
        distance: shop.distance
      };
    }

    const sLat = shop.lat ?? shop.latitude ?? shop.provider?.lat ?? shop.dynamicFormAnswers?.lat ?? null;
    const sLng = shop.lng ?? shop.longitude ?? shop.provider?.lng ?? shop.dynamicFormAnswers?.lng ?? null;

    let distKm = null;
    if (uLat != null && uLng != null && sLat != null && sLng != null) {
      distKm = calculateDistanceKm(uLat, uLng, sLat, sLng);
    }

    const formatted = distKm !== null ? formatDistance(distKm) : (shop.distance || 'Nearby');

    return {
      ...shop,
      lat: sLat,
      lng: sLng,
      distanceKm: distKm ?? 9999,
      distance: formatted
    };
  });

  return processed.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
};
