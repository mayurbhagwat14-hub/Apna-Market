import React, { useEffect } from 'react'; // Updated index to .jsx
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import AppRoutes from './routes';
import { SocketProvider } from './context/SocketContext';
import { CartProvider } from './context/CartContext';
import { CityProvider } from './context/CityContext';
import { BrandingProvider } from './context/BrandingContext';
import { SavedProvider } from './context/SavedContext';
import { LocationPermissionChecker, ScrollToTop } from './components/common';
import LoginPromptModal from './modules/user/components/common/LoginPromptModal';
import { initializePushNotifications, setupForegroundNotificationHandler } from './services/pushNotificationService';

function App() {
  const [loginPrompt, setLoginPrompt] = React.useState({ open: false, title: '', message: '' });

  // Initialize push notifications on app load
  useEffect(() => {
    initializePushNotifications();

    const handleLoginPrompt = (e) => {
      setLoginPrompt({
        open: true,
        title: e.detail?.title || "Create your Apna Market account",
        message: e.detail?.message || "Login to save shops, follow businesses and personalize your experience."
      });
    };
    window.addEventListener('showLoginPrompt', handleLoginPrompt);

    // Setup foreground notification handler
    setupForegroundNotificationHandler((payload) => {
      const notification = payload.notification || {};
      const data = payload.data || {};
      const notifTitle = notification.title || data.title || '🔔 New Notification';
      const notifBody = notification.body || data.body || '';

      // Play notification sound
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {});
      } catch (err) {}

      // Show in-app Toast popup
      toast.custom(
        (t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              if (data.link) window.location.href = data.link;
            }}
            className={`${
              t.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex p-4 cursor-pointer hover:bg-gray-50 transition-all border border-emerald-100 items-start gap-3`}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#016A54] flex items-center justify-center flex-shrink-0 text-xl">
              🔔
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{notifTitle}</p>
              <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">{notifBody}</p>
            </div>
          </div>
        ),
        { duration: 5000, position: 'top-right' }
      );

      // Try browser system notification if supported and granted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notifTitle, {
            body: notifBody,
            icon: '/Homster-logo.png'
          });
        } catch (e) {}
      }

      // Debounced refresh — avoid API storms when many pushes arrive
      clearTimeout(window.__apnaMarketNotifRefreshTimer);
      window.__apnaMarketNotifRefreshTimer = setTimeout(() => {
        window.dispatchEvent(new Event('vendorJobsUpdated'));
        window.dispatchEvent(new Event('vendorStatsUpdated'));
        window.dispatchEvent(new Event('userBookingsUpdated'));
        window.dispatchEvent(new Event('appNotificationReceived'));
      }, 1500);
    });

    return () => {
      window.removeEventListener('showLoginPrompt', handleLoginPrompt);
    };
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <BrandingProvider>
        <SocketProvider>
        <CityProvider>
          <CartProvider>
            <SavedProvider>
              <div className="App">
                <AppRoutes />
                <LocationPermissionChecker />
                <LoginPromptModal
                  isOpen={loginPrompt.open}
                  onClose={() => setLoginPrompt((p) => ({ ...p, open: false }))}
                  title={loginPrompt.title}
                  message={loginPrompt.message}
                />
                <Toaster
                  position="top-center"
                  reverseOrder={false}
                  toastOptions={{
                    duration: 2000,
                    style: {
                      background: '#1F2937',
                      color: '#fff',
                      borderRadius: '12px',
                      padding: '12px 20px',
                      fontSize: '14px',
                      fontWeight: 600,
                    },
                    success: {
                      duration: 1500,
                      style: {
                        background: '#016A54',
                        color: '#fff',
                      },
                    },
                    error: {
                      duration: 2500,
                      style: {
                        background: '#EF4444',
                      },
                    },
                  }}
                />
              </div>
            </SavedProvider>
          </CartProvider>
        </CityProvider>
        </SocketProvider>
      </BrandingProvider>
    </BrowserRouter>
  );
}

export default App;
