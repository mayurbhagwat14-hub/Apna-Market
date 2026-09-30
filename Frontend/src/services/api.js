import axios from 'axios';
import {
  apiCache,
  buildGetCacheKey,
  shouldSkipGetCache,
  invalidateAfterMutation
} from '../utils/apiCache';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 30000,
});

// Helper to get token keys based on role/path
const getTokenKeys = (url) => {
  // 1. Prioritize current page context for role-based tokens
  if (window.location.pathname.startsWith('/admin')) {
    return { access: 'adminAccessToken', refresh: 'adminRefreshToken', role: 'admin' };
  }
  if (window.location.pathname.startsWith('/vendor')) {
    return { access: 'vendorAccessToken', refresh: 'vendorRefreshToken', role: 'vendor' };
  }
  if (window.location.pathname.startsWith('/worker')) {
    return { access: 'workerAccessToken', refresh: 'workerRefreshToken', role: 'worker' };
  }

  // 2. Explicitly detect auth routes regardless of current page (for cross-role login/actions)
  if (url?.includes('/admin/auth')) return { access: 'adminAccessToken', refresh: 'adminRefreshToken', role: 'admin' };
  if (url?.includes('/vendors/auth')) return { access: 'vendorAccessToken', refresh: 'vendorRefreshToken', role: 'vendor' };
  if (url?.includes('/workers/auth')) return { access: 'workerAccessToken', refresh: 'workerRefreshToken', role: 'worker' };

  // 3. Fallback to user token (most common case for user app)
  return { access: 'accessToken', refresh: 'refreshToken', role: 'user' };
};

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const { access } = getTokenKeys(config.url);
    const token = sessionStorage.getItem(access) || localStorage.getItem(access);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Track if we're currently refreshing
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Response interceptor - Handle token refresh + invalidate GET cache on writes
api.interceptors.response.use(
  (response) => {
    const method = (response.config?.method || 'get').toLowerCase();
    if (method !== 'get' && method !== 'head' && method !== 'options') {
      invalidateAfterMutation(response.config?.url || '');
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { access, refresh, role } = getTokenKeys(originalRequest.url);
      const refreshToken = sessionStorage.getItem(refresh) || localStorage.getItem(refresh);

      if (!refreshToken) {
        handleLogout(role);
        return Promise.reject(error);
      }

      try {
        let refreshEndpoint = '/users/auth/refresh-token';
        if (role === 'vendor') refreshEndpoint = '/vendors/auth/refresh-token';
        else if (role === 'worker') refreshEndpoint = '/workers/auth/refresh-token';
        else if (role === 'admin') refreshEndpoint = '/admin/auth/refresh-token';

        const response = await axios.post(`${API_BASE_URL}${refreshEndpoint}`, {
          refreshToken
        });

        const { accessToken } = response.data;

        if (sessionStorage.getItem(access)) {
          sessionStorage.setItem(access, accessToken);
        } else {
          localStorage.setItem(access, accessToken);
        }

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        console.error('RefreshToken failed:', refreshError);
        processQueue(refreshError, null);
        isRefreshing = false;
        handleLogout(role);
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      console.error('Access Denied (403):', error.response.data.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Cached GET with in-flight dedupe (stops StrictMode / multi-mount spam).
 * Opt out: api.get(url, { skipCache: true })
 * Custom TTL seconds: api.get(url, { cacheTtl: 60 })
 */
const rawGet = api.get.bind(api);
api.get = (url, config = {}) => {
  const skipCache = config.skipCache === true || shouldSkipGetCache(url);
  const ttlSeconds = Number.isFinite(config.cacheTtl) ? config.cacheTtl : 45;
  const key = buildGetCacheKey(url, config.params);

  if (!skipCache) {
    const cached = apiCache.get(key);
    if (cached) return Promise.resolve(cached);

    const pending = apiCache.getInflight(key);
    if (pending) return pending;
  }

  const request = rawGet(url, config)
    .then((res) => {
      if (!skipCache && res?.status >= 200 && res?.status <= 304) {
        apiCache.set(key, res, ttlSeconds);
      }
      apiCache.clearInflight(key);
      return res;
    })
    .catch((err) => {
      apiCache.clearInflight(key);
      throw err;
    });

  if (!skipCache) apiCache.setInflight(key, request);
  return request;
};

// Handle logout
export const handleLogout = (role = null) => {
  if (!role) {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) role = 'admin';
    else if (path.startsWith('/vendor')) role = 'vendor';
    else if (path.startsWith('/worker')) role = 'worker';
    else role = 'user';
  }

  apiCache.clear();

  const clearTokens = (prefix) => {
    sessionStorage.removeItem(`${prefix}AccessToken`);
    sessionStorage.removeItem(`${prefix}RefreshToken`);
    sessionStorage.removeItem(`${prefix}Data`);
    localStorage.removeItem(`${prefix}AccessToken`);
    localStorage.removeItem(`${prefix}RefreshToken`);
    localStorage.removeItem(`${prefix}Data`);
  };

  if (role === 'vendor') {
    clearTokens('vendor');
    if (window.location.pathname !== '/vendor/login') {
      window.location.href = '/vendor/login';
    }
  } else if (role === 'worker') {
    clearTokens('worker');
    if (window.location.pathname !== '/worker/login') {
      window.location.href = '/worker/login';
    }
  } else if (role === 'admin') {
    clearTokens('admin');
    if (window.location.pathname !== '/admin/login') {
      window.location.href = '/admin/login';
    }
  } else {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('userData');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/user/login';
    }
  }
};

export { apiCache };
export default api;
