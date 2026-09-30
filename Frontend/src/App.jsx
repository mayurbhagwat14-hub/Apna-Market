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
      // Debounced refresh — avoid API storms when many pushes arrive
      clearTimeout(window.__zevygoNotifRefreshTimer);
      window.__zevygoNotifRefreshTimer = setTimeout(() => {
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
