import { LRUCache } from 'lru-cache';
import { logger } from '../utils/logger.js';

// High-performance in-memory LRU cache with TTL
const localCache = new LRUCache({
  max: 500, // Maximum 500 cached items
  ttl: 1000 * 60 * 5, // 5 minutes default TTL
});

export const cacheService = {
  /**
   * Get value from cache
   */
  get: async (key) => {
    try {
      const val = localCache.get(key);
      if (val !== undefined) {
        logger.debug(`Cache HIT for key: ${key}`);
        return val;
      }
      logger.debug(`Cache MISS for key: ${key}`);
      return null;
    } catch (err) {
      logger.warn(`Cache read error: ${err.message}`);
      return null;
    }
  },

  /**
   * Set value in cache with optional TTL in seconds
   */
  set: async (key, value, ttlSeconds = 300) => {
    try {
      localCache.set(key, value, { ttl: ttlSeconds * 1000 });
      logger.debug(`Cache SET for key: ${key}`);
    } catch (err) {
      logger.warn(`Cache write error: ${err.message}`);
    }
  },

  /**
   * Delete specific cache key
   */
  del: async (key) => {
    try {
      localCache.delete(key);
      logger.debug(`Cache DELETE for key: ${key}`);
    } catch (err) {
      logger.warn(`Cache delete error: ${err.message}`);
    }
  },

  /**
   * Invalidate all keys matching a prefix/pattern
   */
  invalidatePrefix: async (prefix) => {
    try {
      for (const key of localCache.keys()) {
        if (typeof key === 'string' && key.startsWith(prefix)) {
          localCache.delete(key);
        }
      }
      logger.debug(`Cache invalidated prefix: ${prefix}`);
    } catch (err) {
      logger.warn(`Cache invalidatePrefix error: ${err.message}`);
    }
  },

  /**
   * Clear all cache
   */
  clear: async () => {
    localCache.clear();
  },
};
