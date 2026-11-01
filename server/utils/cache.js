/**
 * EventGeniePlan AI - High-Performance In-Memory SHA-256 LRU Cache
 * Provides sub-millisecond memoization for deterministic analysis, budget predictions,
 * and AI responses to optimize server memory and preserve API quota utilization.
 */

const crypto = require('crypto');

class MemoryCache {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxSize=500] Maximum number of entries in the cache
   * @param {number} [options.ttlMs=3600000] Time to live in milliseconds (default: 1 hour)
   */
  constructor(options = {}) {
    this.maxSize = options.maxSize || 500;
    this.ttlMs = options.ttlMs || 60 * 60 * 1000; // 1 hour default
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Generates a deterministic SHA-256 hash key from any payload
   * @param {string|Object} input Payload to hash
   * @returns {string} 64-character hex hash
   */
  hashKey(input) {
    const raw = typeof input === 'string' ? input : JSON.stringify(input);
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Retrieves a cached item if present and unexpired
   * @param {string} key Cache key
   * @returns {any|null}
   */
  get(key) {
    if (!this.cache.has(key)) {
      this.misses++;
      return null;
    }

    const item = this.cache.get(key);
    const now = Date.now();

    if (now > item.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Refresh LRU order: delete and re-insert
    this.cache.delete(key);
    this.cache.set(key, item);
    this.hits++;
    return item.value;
  }

  /**
   * Inserts or updates a value in the cache with LRU eviction
   * @param {string} key Cache key
   * @param {any} value Value to store
   * @param {number} [customTtlMs] Optional custom TTL
   */
  set(key, value, customTtlMs) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest item (first key in Map)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const ttl = customTtlMs || this.ttlMs;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl
    });
  }

  /**
   * Checks if a key exists and is valid without counting as a hit
   * @param {string} key Cache key
   * @returns {boolean}
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }
    const item = this.cache.get(key);
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Clears all cache entries and resets statistics
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Returns current cache telemetry
   * @returns {{ size: number, maxSize: number, hits: number, misses: number, hitRatio: string }}
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRatio = total > 0 ? ((this.hits / total) * 100).toFixed(1) + '%' : '0.0%';
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRatio
    };
  }
}

// Export singleton cache instance
const globalCache = new MemoryCache({ maxSize: 1000, ttlMs: 30 * 60 * 1000 });

module.exports = {
  MemoryCache,
  globalCache
};
