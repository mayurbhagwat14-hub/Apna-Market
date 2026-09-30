/**
 * In-memory GET response cache + in-flight dedupe.
 * Cuts duplicate calls from StrictMode remounts and shared layout fetches.
 */

class ApiCache {
  constructor() {
    this.cache = new Map();
    this.inflight = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key, data, ttlSeconds = 45) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000
    });
  }

  invalidate(key) {
    this.cache.delete(key);
  }

  invalidatePrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
    for (const key of this.inflight.keys()) {
      if (key.startsWith(prefix)) this.inflight.delete(key);
    }
  }

  clear() {
    this.cache.clear();
    this.inflight.clear();
  }

  getInflight(key) {
    return this.inflight.get(key) || null;
  }

  setInflight(key, promise) {
    this.inflight.set(key, promise);
  }

  clearInflight(key) {
    this.inflight.delete(key);
  }
}

export const apiCache = new ApiCache();

/** Stable cache key for GET requests */
export const buildGetCacheKey = (url = '', params) => {
  const role = (typeof window !== 'undefined' && window.location.pathname.split('/')[1]) || 'app';
  const q = params && Object.keys(params).length ? JSON.stringify(params) : '';
  return `GET:${role}:${url}?${q}`;
};

/** Paths that must never be cached (auth / realtime-ish). */
export const shouldSkipGetCache = (url = '') => {
  const u = String(url).toLowerCase();
  return (
    u.includes('/auth/') ||
    u.includes('refresh-token') ||
    u.includes('/socket') ||
    u.includes('/otp') ||
    u.includes('/upload')
  );
};

/**
 * After mutating writes, drop related GET caches so UI sees fresh data.
 */
export const invalidateAfterMutation = (url = '') => {
  const u = String(url);
  if (u.includes('/vendors/services') || u.includes('/vendors/categories')) {
    apiCache.invalidatePrefix('GET:vendor:/vendors/services');
    apiCache.invalidatePrefix('GET:vendor:/vendors/categories');
  }
  if (u.includes('/vendors/wallet') || u.includes('/vendors/transactions')) {
    apiCache.invalidatePrefix('GET:vendor:/vendors/wallet');
    apiCache.invalidatePrefix('GET:vendor:/vendors/transactions');
  }
  if (u.includes('/notifications')) {
    apiCache.invalidatePrefix('GET:vendor:/notifications');
    apiCache.invalidatePrefix('GET:user:/notifications');
    apiCache.invalidatePrefix('GET:admin:/notifications');
  }
  if (u.includes('/users/') || u.includes('/vendors/profile') || u.includes('/vendors/me')) {
    apiCache.invalidatePrefix('GET:vendor:/vendors/');
    apiCache.invalidatePrefix('GET:user:/users/');
  }
};

export default apiCache;
