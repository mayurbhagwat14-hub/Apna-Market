/**
 * Push Notification Service
 * Handles FCM token registration and notification handling
 */

import { messaging, getToken, onMessage } from '../firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Get the platform type for this web app (always 'web' since this is browser-based)
 * @returns {'web'}
 */
export function getPlatformType() {
  return 'web';
}

/**
 * Register service worker for push notifications
 * @returns {Promise<ServiceWorkerRegistration>}
 */
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const swParams = new URLSearchParams({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
      }).toString();

      const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${swParams}`);
      // console.log('✅ Service Worker registered:', registration.scope);
      return registration;
    } catch (error) {
      // console.error('❌ Service Worker registration failed:', error);
      throw error;
    }
  } else {
    throw new Error('Service Workers are not supported in this browser');
  }
}

/**
 * Request notification permission from user
 * @returns {Promise<boolean>}
 */
async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // console.log('✅ Notification permission granted');
      return true;
    } else {
      // console.log('❌ Notification permission denied');
      return false;
    }
  }
  // console.log('❌ Notifications not supported');
  return false;
}

/**
 * Get FCM token from Firebase
 * @returns {Promise<string|null>}
 */
async function getFCMToken() {
  try {
    if (!messaging) {
      // console.error('Firebase messaging not initialized');
      return null;
    }

    const registration = await registerServiceWorker();
    await registration.update(); // Update service worker

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      // console.log('✅ FCM Token obtained:', token.substring(0, 20) + '...');
      return token;
    } else {
      // console.log('❌ No FCM token available');
      return null;
    }
  } catch (error) {
    // console.error('❌ Error getting FCM token:', error);
    throw error;
  }
}

/**
 * Register FCM token with backend
 * @param {string} userType - 'user', 'vendor', or 'worker'
 * @param {boolean} forceUpdate - Force token update
 * @returns {Promise<string|null>}
 */
async function registerFCMToken(userType = 'user', forceUpdate = false) {
  try {
    const platform = getPlatformType();

    // Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('[FCM] Notification permission not granted');
      return null;
    }

    // Get token from Firebase
    const token = await getFCMToken();
    if (!token) {
      console.log('[FCM] Failed to obtain FCM token from Firebase');
      return null;
    }

    // Determine API endpoint and auth token key
    let endpoint;
    let authTokenKey;
    switch (userType) {
      case 'vendor':
        endpoint = '/vendors/fcm-tokens/save';
        authTokenKey = 'vendorAccessToken';
        break;
      case 'worker':
        endpoint = '/workers/fcm-tokens/save';
        authTokenKey = 'workerAccessToken';
        break;
      case 'user':
      default:
        endpoint = '/users/fcm-tokens/save';
        authTokenKey = 'accessToken';
        break;
    }

    const authToken = localStorage.getItem(authTokenKey) || sessionStorage.getItem(authTokenKey);
    if (!authToken) {
      console.log(`[FCM] No auth token found for ${userType}, skipping registration`);
      return null;
    }

    // Save directly to MongoDB Database under appropriate field (fcmTokens or fcmTokenMobile)
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        token: token,
        platform: platform // 'web' or 'mobile'
      })
    });

    if (response.ok) {
      console.log(`[FCM] ✅ FCM token saved to database (${platform}) successfully!`);
      return token;
    } else {
      const error = await response.json();
      console.error('[FCM] ❌ Failed to register token with backend database:', error);
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error registering FCM token:', error);
    return null;
  }
}

/**
 * Remove FCM token from backend database on logout
 * @param {string} userType - 'user', 'vendor', or 'worker'
 */
async function removeFCMToken(userType = 'user') {
  try {
    const platform = getPlatformType();

    let endpoint;
    let authTokenKey;
    switch (userType) {
      case 'vendor':
        endpoint = '/vendors/fcm-tokens/remove';
        authTokenKey = 'vendorAccessToken';
        break;
      case 'worker':
        endpoint = '/workers/fcm-tokens/remove';
        authTokenKey = 'workerAccessToken';
        break;
      case 'user':
      default:
        endpoint = '/users/fcm-tokens/remove';
        authTokenKey = 'accessToken';
    }

    const authToken = localStorage.getItem(authTokenKey) || sessionStorage.getItem(authTokenKey);
    if (!authToken) {
      return;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    // Remove token from database
    await fetch(`${baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        platform: platform
      })
    });
    console.log(`[FCM] ✅ Token removed from database for ${platform}`);
  } catch (error) {
    console.error('[FCM] Error removing FCM token from database:', error);
  }
}

/**
 * Setup foreground notification handler
 * @param {Function} handler - Custom handler function
 */
function setupForegroundNotificationHandler(handler) {
  if (!messaging) {
    // console.error('Firebase messaging not initialized');
    return;
  }

  onMessage(messaging, (payload) => {
    // console.log('📬 Foreground message received:', payload);

    const data = payload.data || {};
    const notification = payload.notification || {};

    // Use notification fields first, then data fields as fallback (for data-only messages)
    const title = notification.title || data.title || 'New Notification';
    const body = notification.body || data.body || '';
    const icon = notification.icon || data.icon || '/HomeBuddy-header-logo.png';
    const type = data.type || data.notificationType || 'default';

    // Call custom handler (e.g. for toast)
    if (handler) {
      handler(payload);
    }
  });
}

/**
 * Initialize push notifications
 * Call this on app load
 */
async function initializePushNotifications() {
  try {
    if (!('serviceWorker' in navigator)) {
      // console.log('Service workers not supported');
      return;
    }

    if (!('Notification' in window)) {
      // console.log('Notifications not supported');
      return;
    }

    await registerServiceWorker();
    // console.log('✅ Push notifications initialized');
  } catch (error) {
    // console.error('Error initializing push notifications:', error);
  }
}

export {
  initializePushNotifications,
  registerFCMToken,
  removeFCMToken,
  setupForegroundNotificationHandler,
  requestNotificationPermission,
  getFCMToken
};
