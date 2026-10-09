import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';
import { DEFAULT_USER_LOCATION } from '../utils/distance';

const CityContext = createContext();

export const useCity = () => useContext(CityContext);

const CITY_COORDINATES = {
  indore: { lat: 22.7196, lng: 75.8577 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  delhi: { lat: 28.6139, lng: 77.2090 },
  mumbai: { lat: 19.0760, lng: 72.8777 }
};

export const CityProvider = ({ children }) => {
  const [currentCity, setCurrentCity] = useState(null);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(DEFAULT_USER_LOCATION);
  const [userAddresses, setUserAddresses] = useState([]);
  const [activeAddress, setActiveAddress] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Restore stored location or saved user address on mount
  useEffect(() => {
    try {
      const storedLocation = localStorage.getItem('apna_user_location');
      if (storedLocation) {
        setUserLocation(JSON.parse(storedLocation));
      }
    } catch (e) {
      // ignore
    }

    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const u = JSON.parse(userDataStr);
        if (Array.isArray(u.addresses) && u.addresses.length > 0) {
          setUserAddresses(u.addresses);
          const def = u.addresses.find(a => a.isDefault) || u.addresses[0];
          setActiveAddress(def);
          
          // If no custom GPS location was stored, prioritize saved user address
          const hasStored = localStorage.getItem('apna_user_location');
          if (!hasStored) {
            const cityName = def.city || 'Indore';
            const cityKey = cityName.toLowerCase().trim();
            const coords = CITY_COORDINATES[cityKey] || DEFAULT_USER_LOCATION;
            const fullLabel = [def.addressLine1, def.landmark, def.city].filter(Boolean).join(', ') || `${cityName}, MP`;
            
            const loc = {
              lat: def.lat || coords.lat,
              lng: def.lng || coords.lng,
              cityName: def.city || 'Indore',
              addressName: fullLabel,
              source: 'saved_address'
            };
            setUserLocation(loc);
            localStorage.setItem('apna_user_location', JSON.stringify(loc));
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Load cities from backend
  useEffect(() => {
    const initCity = async () => {
      try {
        setLoading(true);
        const response = await api.get('/public/cities');

        if (response.data.success && response.data.cities.length > 0) {
          const fetchedCities = response.data.cities;
          setCities(fetchedCities);

          const savedCityId = localStorage.getItem('selectedCityId');
          let selected = null;

          if (savedCityId) {
            selected = fetchedCities.find(c => c._id === savedCityId || c.id === savedCityId);
          }

          if (!selected) {
            selected = fetchedCities.find(c => c.isDefault) || fetchedCities[0];
          }

          setCurrentCity(selected);
          if (selected) {
            localStorage.setItem('selectedCityId', selected._id || selected.id);
          }
        }
      } catch (error) {
        console.error('Failed to load cities:', error);
      } finally {
        setLoading(false);
      }
    };

    initCity();
  }, []);

  // Update city selection
  const selectCity = (city) => {
    setCurrentCity(city);
    if (city) {
      localStorage.setItem('selectedCityId', city._id || city.id);
      const cityKey = (city.name || '').toLowerCase().trim();
      const coords = CITY_COORDINATES[cityKey] || DEFAULT_USER_LOCATION;
      const newLoc = {
        lat: coords.lat,
        lng: coords.lng,
        cityName: city.name,
        addressName: `${city.name}, ${city.state || 'Madhya Pradesh'}`,
        source: 'city'
      };
      setUserLocation(newLoc);
      localStorage.setItem('apna_user_location', JSON.stringify(newLoc));
    } else {
      localStorage.removeItem('selectedCityId');
    }
  };

  // User selects a specific saved address from their profile
  const selectSavedAddress = (addr) => {
    if (!addr) return;
    setActiveAddress(addr);
    const cityName = addr.city || currentCity?.name || 'Indore';
    const cityKey = cityName.toLowerCase().trim();
    const coords = CITY_COORDINATES[cityKey] || DEFAULT_USER_LOCATION;
    const fullLabel = [addr.addressLine1, addr.landmark, addr.city].filter(Boolean).join(', ') || `${cityName}, MP`;

    const newLoc = {
      lat: addr.lat || coords.lat,
      lng: addr.lng || coords.lng,
      cityName,
      addressName: fullLabel,
      source: 'saved_address'
    };
    setUserLocation(newLoc);
    localStorage.setItem('apna_user_location', JSON.stringify(newLoc));

    // Also align currentCity if it matches a known city
    const matchedCity = cities.find(c => c.name?.toLowerCase() === cityName.toLowerCase());
    if (matchedCity) {
      setCurrentCity(matchedCity);
      localStorage.setItem('selectedCityId', matchedCity._id || matchedCity.id);
    }
  };

  // Detect current location using browser GPS
  const detectCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      setIsDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsDetectingLocation(false);
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const cityName = currentCity?.name || 'Indore';
          const newLoc = {
            lat,
            lng,
            cityName,
            addressName: `Current Location (${cityName})`,
            source: 'gps'
          };
          setUserLocation(newLoc);
          localStorage.setItem('apna_user_location', JSON.stringify(newLoc));
          resolve(newLoc);
        },
        (error) => {
          setIsDetectingLocation(false);
          console.warn('Geolocation permission error or timeout:', error);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [currentCity]);

  // Set explicit coordinates (e.g. from map or address pin)
  const setExplicitLocation = (loc) => {
    if (!loc) return;
    setUserLocation(loc);
    localStorage.setItem('apna_user_location', JSON.stringify(loc));
  };

  const value = {
    currentCity,
    cities,
    selectCity,
    userLocation,
    userAddresses,
    activeAddress,
    selectSavedAddress,
    detectCurrentLocation,
    setExplicitLocation,
    isDetectingLocation,
    loading
  };

  return (
    <CityContext.Provider value={value}>
      {children}
    </CityContext.Provider>
  );
};
