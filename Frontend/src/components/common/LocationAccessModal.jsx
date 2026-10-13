import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiNavigation, FiX, FiSettings, FiRefreshCw, FiMapPin } from 'react-icons/fi';
import { themeColors } from '../../theme';
import { toast } from 'react-hot-toast';
import flutterBridge from '../../utils/flutterBridge';
import { useBranding } from '../../context/BrandingContext';
import { useCity } from '../../context/CityContext';

const LocationAccessModal = ({
  isOpen,
  onClose,
  onSuccess,
  onManualSearch,
  initialLocationDisabled = false,
  userType = 'user' // 'user' | 'vendor' | 'worker'
}) => {
  const { branding } = useBranding();
  const { detectCurrentLocation } = useCity();
  const [requesting, setRequesting] = useState(false);
  const [locationDisabled, setLocationDisabled] = useState(initialLocationDisabled);

  const getTheme = () => {
    switch (userType) {
      case 'vendor': return themeColors.vendor || themeColors;
      case 'worker': return themeColors.worker || themeColors;
      default: return themeColors.user || themeColors;
    }
  };

  const currentTheme = getTheme();
  const themeColor = currentTheme?.button || '#016A54';

  const getContent = () => {
    if (locationDisabled) {
      return {
        title: "LOCATION UNAVAILABLE",
        subtitle: `Please allow location access so we can detect your exact position and show nearby stores.`,
        icon: FiSettings
      };
    }
    return {
      title: "ENABLE LOCATION",
      subtitle: `${branding?.appName || 'Apna Market'} uses your exact GPS position + Google Maps to show nearby stores and calculate distances.`,
      icon: FiNavigation
    };
  };

  const content = getContent();

  const handleRequestLocation = async () => {
    setRequesting(true);
    try {
      const res = await detectCurrentLocation();
      setRequesting(false);
      setLocationDisabled(false);
      const locName = res?.location?.addressName || 'Current Location';
      toast.success(`Location set: ${locName}`);
      if (onSuccess) onSuccess(res?.location);
      if (onClose) onClose();
    } catch (error) {
      setRequesting(false);
      setLocationDisabled(true);

      let errorMsg = "Could not access location. Please make sure device GPS is ON.";
      if (error?.code === 1) {
        errorMsg = "Location permission blocked. Please enable it in browser settings.";
      } else if (error?.code === 2) {
        errorMsg = "GPS signal unavailable. Please ensure device location is turned ON.";
      } else if (error?.code === 3) {
        errorMsg = "Location request timed out. Please try again.";
      }
      toast.error(errorMsg);
    }
  };

  const handleOpenSettings = () => {
    if (flutterBridge.isFlutter) {
      flutterBridge.openAppSettings();
      onClose();
    } else {
      toast("Please click the lock 🔒 or site settings icon in your browser URL bar to allow Location.");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white w-full max-w-sm rounded-[2.2rem] overflow-hidden shadow-2xl z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative Header with Pulse Effect */}
          <div
            className="h-32 relative flex items-center justify-center overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${themeColor} 0%, #014D3D 100%)` }}
          >
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-2xl" />
            </div>

            {/* Glowing Pulse Rings */}
            <div className="absolute w-28 h-28 rounded-full border border-white/20 animate-ping opacity-30" />
            <div className="absolute w-20 h-20 rounded-full border border-white/30" />

            <motion.div
              animate={locationDisabled ? { rotate: [0, 8, -8, 0] } : { y: [0, -4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className={`w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center relative z-10 ${
                locationDisabled ? 'text-amber-600' : 'text-[#016A54]'
              }`}
            >
              <content.icon className="w-8 h-8" />
            </motion.div>
          </div>

          <div className="p-6 sm:p-7 pt-5 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-2.5 bg-emerald-50 text-[#016A54]">
              <FiNavigation className="w-3.5 h-3.5" />
              <span>Exact Location</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 leading-tight">
              {content.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-6 font-medium leading-relaxed">
              {content.subtitle}
            </p>

            {/* Helper Alert for Disabled / Blocked Status */}
            {locationDisabled && (
              <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-left text-xs text-amber-900 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 text-amber-950 mb-1">
                  <span>⚠️ How to enable location:</span>
                </p>
                <p className="text-[11px] text-amber-800">
                  1. Turn ON device location (GPS) in your phone settings or quick panel.
                  <br />
                  2. If blocked in browser, tap the lock 🔒 / settings icon next to the address bar & allow Location.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5">
              {/* Primary Action Button */}
              <button
                type="button"
                onClick={handleRequestLocation}
                disabled={requesting}
                className="w-full py-3.5 sm:py-4 rounded-xl text-white font-black text-sm sm:text-base shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                style={{
                  backgroundColor: themeColor,
                  boxShadow: `0 8px 20px -4px ${themeColor}66`
                }}
              >
                {requesting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Detecting Coordinates...</span>
                  </>
                ) : locationDisabled ? (
                  <>
                    <FiRefreshCw className="w-4 h-4" />
                    <span>TRY AGAIN</span>
                  </>
                ) : (
                  <>
                    <FiNavigation className="w-4 h-4" />
                    <span>TURN ON LOCATION</span>
                  </>
                )}
              </button>

              {/* Native App Settings Button if in Flutter */}
              {locationDisabled && flutterBridge.isFlutter && (
                <button
                  type="button"
                  onClick={handleOpenSettings}
                  className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FiSettings className="w-4 h-4" />
                  <span>OPEN DEVICE SETTINGS</span>
                </button>
              )}

              {/* Manual Selection Option */}
              {onManualSearch && (
                <button
                  type="button"
                  onClick={onManualSearch}
                  className="w-full py-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-gray-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FiMapPin className="w-4 h-4 text-[#016A54]" />
                  <span>SELECT CITY MANUALLY</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                Maybe Later
              </button>
            </div>

            <p className="mt-4 text-[10px] text-gray-400">
              Location is used securely to calculate shop distances & deliveries.
            </p>
          </div>

          {/* Close X Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-2 bg-black/10 hover:bg-black/20 rounded-full text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <FiX className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LocationAccessModal;
