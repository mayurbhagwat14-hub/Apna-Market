import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { FiCrosshair, FiMapPin, FiSearch, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const libraries = ['places', 'geometry'];

const mapContainerStyle = {
  width: '100%',
  height: '240px',
  borderRadius: '16px'
};

const defaultCenter = {
  lat: 22.7196,
  lng: 75.8577
};

// Clean minimalist map style for business map
const mapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#f8f9fa' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#f1f3f4' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#eceff1' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] }
];

const parseAddressComponents = (components) => {
  let city = '';
  let state = '';
  let pincode = '';
  let landmark = '';
  let sublocality = '';

  if (Array.isArray(components)) {
    components.forEach((c) => {
      if (c.types.includes('locality')) city = c.long_name;
      if (c.types.includes('administrative_area_level_1')) state = c.long_name;
      if (c.types.includes('postal_code')) pincode = c.long_name;
      if (c.types.includes('sublocality_level_1') || c.types.includes('sublocality')) {
        sublocality = c.long_name;
      }
      if (c.types.includes('neighborhood') || c.types.includes('landmark')) {
        landmark = c.long_name;
      }
    });
  }

  return { city, state, pincode, landmark: landmark || sublocality };
};

const VendorLocationPicker = ({
  initialPosition = null,
  onLocationSelect,
  placeholder = 'Search shop address, market, or landmark...'
}) => {
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(initialPosition?.lat && initialPosition?.lng ? initialPosition : defaultCenter);
  const [autocomplete, setAutocomplete] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [hasCapturedCoords, setHasCapturedCoords] = useState(Boolean(initialPosition?.lat && initialPosition?.lng));
  const [searchInputValue, setSearchInputValue] = useState('');
  const searchInputRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  // Sync if initialPosition changes externally
  useEffect(() => {
    if (initialPosition?.lat && initialPosition?.lng) {
      const pos = { lat: Number(initialPosition.lat), lng: Number(initialPosition.lng) };
      setMarker(pos);
      setHasCapturedCoords(true);
      if (map) {
        map.panTo(pos);
        map.setZoom(16);
      }
    }
  }, [initialPosition?.lat, initialPosition?.lng, map]);

  // Reverse Geocoding via Google Maps
  const reverseGeocode = useCallback((pos) => {
    if (!window.google?.maps?.Geocoder) return;

    setIsGeocoding(true);
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ location: pos }, (results, status) => {
      setIsGeocoding(false);
      if (status === 'OK' && results?.[0]) {
        const place = results[0];
        const parsed = parseAddressComponents(place.address_components);

        const locationData = {
          lat: pos.lat,
          lng: pos.lng,
          fullAddress: place.formatted_address || '',
          city: parsed.city,
          state: parsed.state,
          pincode: parsed.pincode,
          landmark: parsed.landmark,
          components: place.address_components
        };

        setSearchInputValue(place.formatted_address || '');
        setHasCapturedCoords(true);

        if (onLocationSelect) {
          onLocationSelect(locationData);
        }
      } else {
        console.warn('Reverse geocode status:', status);
      }
    });
  }, [onLocationSelect]);

  // Handle current location GPS button
  const handleFetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setMarker(newPos);
        setHasCapturedCoords(true);

        if (map) {
          map.panTo(newPos);
          map.setZoom(17);
        }

        reverseGeocode(newPos);
        toast.success('Live GPS location detected!');
      },
      (error) => {
        setIsLocating(false);
        let msg = 'Could not fetch current location. Please search or pick on map.';
        if (error.code === 1) msg = 'Location permission denied. Please search or click map.';
        else if (error.code === 2) msg = 'GPS is turned off. Please enable GPS.';
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle Autocomplete Place selection
  const onPlaceChanged = () => {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();

    if (place?.geometry?.location) {
      const newPos = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };

      setMarker(newPos);
      setHasCapturedCoords(true);

      if (map) {
        map.panTo(newPos);
        map.setZoom(17);
      }

      const parsed = parseAddressComponents(place.address_components);
      const locationData = {
        lat: newPos.lat,
        lng: newPos.lng,
        fullAddress: place.formatted_address || searchInputValue,
        city: parsed.city,
        state: parsed.state,
        pincode: parsed.pincode,
        landmark: parsed.landmark,
        components: place.address_components
      };

      setSearchInputValue(place.formatted_address || '');

      if (onLocationSelect) {
        onLocationSelect(locationData);
      }

      toast.success('Location selected from search!');
    }
  };

  // Handle Map Click
  const onMapClick = useCallback((e) => {
    if (!e.latLng) return;
    const newPos = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    setMarker(newPos);
    setHasCapturedCoords(true);
    reverseGeocode(newPos);
  }, [reverseGeocode]);

  // Handle Marker Drag End
  const onMarkerDragEnd = useCallback((e) => {
    if (!e.latLng) return;
    const newPos = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    setMarker(newPos);
    setHasCapturedCoords(true);
    reverseGeocode(newPos);
  }, [reverseGeocode]);

  return (
    <div className="space-y-3 w-full">
      {/* 1. Type Specific Location (Google Places Autocomplete) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-700 tracking-tight flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FiMapPin className="w-3.5 h-3.5 text-[#016A54]" />
            Search or Type Specific Location *
          </span>
          {hasCapturedCoords && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <FiCheckCircle className="w-3 h-3" />
              GPS Traced ({marker.lat.toFixed(4)}, {marker.lng.toFixed(4)})
            </span>
          )}
        </label>

        <div className="flex gap-2">
          <div className="relative flex-1">
            {isLoaded ? (
              <Autocomplete
                onLoad={setAutocomplete}
                onPlaceChanged={onPlaceChanged}
                options={{
                  componentRestrictions: { country: 'in' },
                  fields: ['geometry', 'formatted_address', 'address_components']
                }}
              >
                <div className="relative">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchInputValue}
                    onChange={(e) => setSearchInputValue(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#016A54] focus:border-transparent transition-all shadow-xs"
                  />
                </div>
              </Autocomplete>
            ) : (
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  disabled
                  placeholder="Loading Google Places..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-400"
                />
              </div>
            )}
          </div>

          {/* 2. Fetch Current GPS Location Button */}
          <button
            type="button"
            onClick={handleFetchCurrentLocation}
            disabled={isLocating}
            className="px-3.5 py-2.5 bg-[#016A54] hover:bg-[#015342] active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all shrink-0 disabled:opacity-60"
            title="Fetch Current Location via GPS"
          >
            {isLocating ? (
              <FiLoader className="w-4 h-4 animate-spin" />
            ) : (
              <FiCrosshair className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Use Live GPS</span>
            <span className="sm:hidden">GPS</span>
          </button>
        </div>
      </div>

      {/* 3. Interactive Map Canvas */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={marker}
            zoom={hasCapturedCoords ? 16 : 14}
            onClick={onMapClick}
            onLoad={setMap}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              gestureHandling: 'greedy',
              styles: mapStyles
            }}
          >
            <Marker
              position={marker}
              draggable={true}
              onDragEnd={onMarkerDragEnd}
              animation={window.google?.maps?.Animation?.DROP}
            />
          </GoogleMap>
        ) : loadError ? (
          <div className="h-60 flex flex-col items-center justify-center p-4 text-center">
            <p className="text-xs text-amber-700 font-medium">Map preview unavailable offline. You can still type your address manually below.</p>
          </div>
        ) : (
          <div className="h-60 flex flex-col items-center justify-center gap-2 text-gray-400">
            <FiLoader className="w-6 h-6 animate-spin text-[#016A54]" />
            <p className="text-xs font-medium">Loading Google Map...</p>
          </div>
        )}

        {/* Floating guidance pill on top of map */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-xs text-white px-3 py-1 rounded-full text-[11px] font-medium pointer-events-none z-10 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
          {isGeocoding ? (
            <>
              <FiLoader className="w-3 h-3 animate-spin text-emerald-400" />
              <span>Fetching address from pin...</span>
            </>
          ) : (
            <>
              <FiMapPin className="w-3 h-3 text-emerald-400" />
              <span>Drag pin or click map to set exact shop location</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorLocationPicker;
