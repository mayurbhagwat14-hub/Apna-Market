import React, { useState, useEffect } from 'react';
import { useCity } from '../../context/CityContext';
import LocationAccessModal from './LocationAccessModal';
import CitySelectorModal from '../../modules/user/components/common/CitySelectorModal';

/**
 * Global Location Permission Checker Component
 * Automatically detects device GPS location on app load.
 * If location is turned off or permission is denied, prompts the user with LocationAccessModal.
 */
export const LocationPermissionChecker = () => {
  const { detectCurrentLocation, userLocation } = useCity();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locationDisabled, setLocationDisabled] = useState(false);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const runAutoLocationCheck = async (isManual = false) => {
      const isDismissed = sessionStorage.getItem('location_prompt_dismissed') === 'true';

      // 1. If manual trigger, directly attempt detection
      if (isManual) {
        try {
          await detectCurrentLocation();
          if (isMounted) {
            setIsModalOpen(false);
          }
        } catch (err) {
          if (isMounted) {
            setLocationDisabled(err?.code === 1 || err?.code === 2 || true);
            setIsModalOpen(true);
          }
        }
        return;
      }

      // 2. Check Permissions API if supported in browser
      if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });

          if (permissionStatus.state === 'granted') {
            // Already permitted: fetch GPS coordinates & reverse geocode quietly
            try {
              await detectCurrentLocation();
            } catch (err) {
              console.warn('[LocationPermissionChecker] Granted check failed:', err?.message);
            }
            return;
          }

          if (permissionStatus.state === 'denied') {
            // Permission is blocked or GPS is turned off
            if (!isDismissed && isMounted) {
              setLocationDisabled(true);
              setIsModalOpen(true);
            }
            return;
          }

          // State is 'prompt' (first visit or unselected)
          if (!isDismissed && isMounted) {
            try {
              await detectCurrentLocation();
            } catch (err) {
              if (isMounted) {
                // If user declined or device location is off, show friendly popup
                setLocationDisabled(err?.code === 1 || err?.code === 2);
                setIsModalOpen(true);
              }
            }
          }

          // Reactively respond if user changes permission in browser settings
          permissionStatus.onchange = () => {
            if (permissionStatus.state === 'granted') {
              detectCurrentLocation().catch(() => {});
              if (isMounted) setIsModalOpen(false);
            }
          };

          return;
        } catch (e) {
          // Fallback to standard check below
        }
      }

      // 3. Fallback for browsers without navigator.permissions.query
      const hasGrantedPreviously = localStorage.getItem('location_granted') === 'true';
      if (hasGrantedPreviously) {
        try {
          await detectCurrentLocation();
        } catch (err) {
          if (!isDismissed && isMounted) {
            setLocationDisabled(true);
            setIsModalOpen(true);
          }
        }
      } else if (!isDismissed && isMounted) {
        try {
          await detectCurrentLocation();
        } catch (err) {
          if (isMounted) {
            setLocationDisabled(err?.code === 1 || err?.code === 2);
            setIsModalOpen(true);
          }
        }
      }
    };

    // Slight delay so the app renders smoothly first
    const timer = setTimeout(() => {
      runAutoLocationCheck(false);
    }, 1000);

    // Global listener for manual trigger (from buttons or other components)
    const handleManualTrigger = () => {
      runAutoLocationCheck(true);
    };

    window.addEventListener('requestLocationPrompt', handleManualTrigger);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      window.removeEventListener('requestLocationPrompt', handleManualTrigger);
    };
  }, [detectCurrentLocation]);

  const handleCloseModal = () => {
    sessionStorage.setItem('location_prompt_dismissed', 'true');
    setIsModalOpen(false);
  };

  const handleManualSearch = () => {
    setIsModalOpen(false);
    setIsCityModalOpen(true);
  };

  return (
    <>
      <LocationAccessModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={() => {
          setIsModalOpen(false);
        }}
        onManualSearch={handleManualSearch}
        initialLocationDisabled={locationDisabled}
        userType="user"
      />

      <CitySelectorModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
      />
    </>
  );
};

export default LocationPermissionChecker;
