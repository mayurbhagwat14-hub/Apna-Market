/**
 * Reverse Geocoding Utility for Apna Market
 * Converts geographic coordinates (latitude, longitude) into human-readable address,
 * area/sublocality, and city name using:
 * 1. window.google.maps.Geocoder (if Google Maps JS SDK loaded)
 * 2. Google Maps Geocoding REST API (using VITE_GOOGLE_MAPS_API_KEY)
 * 3. OpenStreetMap Nominatim API (free, reliable fallback)
 */
/**
 * Fetches current device/network location directly using Google Maps Geolocation API
 * without relying on hardware GPS sensor.
 */
export const fetchLocationViaMapApi = async () => {
  const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key not found');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Google Maps Geolocation API error (${response.status})`);
    }

    const data = await response.json();
    if (!data?.location?.lat || !data?.location?.lng) {
      throw new Error('Google Maps Geolocation API returned no coordinates');
    }

    return {
      latitude: data.location.lat,
      longitude: data.location.lng,
      accuracy: data.accuracy,
      source: 'map_api'
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

export const reverseGeocodeCoords = async (lat, lng) => {
  if (lat == null || lng == null) return null;

  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (isNaN(latNum) || isNaN(lngNum)) return null;

  // Helper to extract address components from Google Maps format
  const parseGoogleComponents = (components = [], formatted = '') => {
    const getComp = (type) =>
      components.find((c) => Array.isArray(c.types) && c.types.includes(type))?.long_name || '';

    // Prioritize specific local area
    const sublocality = getComp('sublocality_level_1') || getComp('sublocality') || getComp('sublocality_level_2');
    const neighborhood = getComp('neighborhood');
    const locality = getComp('locality');
    const admin2 = getComp('administrative_area_level_2');
    const admin1 = getComp('administrative_area_level_1');
    const postal = getComp('postal_code');

    const area = sublocality || neighborhood || '';
    const city = locality || admin2 || '';
    const state = admin1 || 'Madhya Pradesh';
    const pincode = postal || '';

    let display = '';
    if (area && city && area.toLowerCase() !== city.toLowerCase()) {
      display = `${area}, ${city}`;
    } else if (city) {
      display = `Current Location (${city})`;
    } else if (area) {
      display = `Current Location (${area})`;
    } else {
      display = 'Current Location';
    }

    return {
      area,
      city: city || 'Indore',
      state,
      pincode,
      addressName: display,
      fullAddress: formatted || display,
      source: 'google'
    };
  };

  // 1. Try Google Maps JS Geocoder if available on window
  if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
    try {
      const result = await new Promise((resolve, reject) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat: latNum, lng: lngNum } }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            resolve(results[0]);
          } else {
            reject(new Error(`Google Geocoder status: ${status}`));
          }
        });
      });

      if (result) {
        return parseGoogleComponents(result.address_components, result.formatted_address);
      }
    } catch (e) {
      // Quietly continue to next strategy
    }
  }

  // 2. Try Google Geocoding REST API via VITE_GOOGLE_MAPS_API_KEY
  const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latNum},${lngNum}&key=${apiKey}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
          const first = data.results[0];
          return parseGoogleComponents(first.address_components, first.formatted_address);
        }
      }
    } catch (e) {
      // Quietly continue to OpenStreetMap Nominatim
    }
  }

  // 3. Fallback: OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lngNum}&zoom=18&addressdetails=1`;
    const resp = await fetch(nomUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      const addr = data.address || {};

      const area =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.quarter ||
        addr.road ||
        '';

      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.city_district ||
        addr.state_district ||
        addr.county ||
        '';

      const state = addr.state || 'Madhya Pradesh';
      const pincode = addr.postcode || '';

      let display = '';
      if (area && city && area.toLowerCase() !== city.toLowerCase()) {
        display = `${area}, ${city}`;
      } else if (city) {
        display = `Current Location (${city})`;
      } else if (area) {
        display = `Current Location (${area})`;
      } else {
        display = 'Current Location';
      }

      return {
        area,
        city: city || 'Indore',
        state,
        pincode,
        addressName: display,
        fullAddress: data.display_name || display,
        source: 'nominatim'
      };
    }
  } catch (e) {
    // Quietly fallback
  }

  // 4. Default fallback if all reverse geocode attempts fail
  return {
    area: '',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '',
    addressName: 'Current Location (Indore)',
    fullAddress: 'Indore, Madhya Pradesh',
    source: 'fallback'
  };
};

export default reverseGeocodeCoords;
