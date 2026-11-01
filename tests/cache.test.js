/**
 * In-Memory LRU Cache Tests - EventGeniePlan AI
 */

const { MemoryCache } = require('../server/utils/cache');

describe('MemoryCache SHA-256 LRU Engine', () => {
  let cache;

  beforeEach(() => {
    cache = new MemoryCache({ maxSize: 3, ttlMs: 1000 });
  });

  test('generates deterministic 64-character SHA-256 hash keys', () => {
    const key1 = cache.hashKey('test-payload');
    const key2 = cache.hashKey('test-payload');
    const key3 = cache.hashKey('different-payload');

    expect(key1).toHaveLength(64);
    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
  });

  test('stores and retrieves cached values with high-speed hit tracking', () => {
    const key = cache.hashKey({ eventType: 'Wedding', budget: 45000 });
    cache.set(key, { score: 85, status: 'healthy' });

    expect(cache.has(key)).toBe(true);
    const retrieved = cache.get(key);
    expect(retrieved.score).toBe(85);
    expect(cache.hits).toBe(1);
    expect(cache.misses).toBe(0);
  });

  test('evicts oldest entry when exceeding maxSize capacity (LRU policy)', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    // Access key1 to make key2 the least recently used
    cache.get('key1');

    // Add 4th item, exceeding maxSize of 3
    cache.set('key4', 'value4');

    expect(cache.has('key2')).toBe(false); // Key2 evicted
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('key3')).toBe(true);
    expect(cache.has('key4')).toBe(true);
  });

  test('respects TTL and expires stale cached entries', async () => {
    const shortTtlCache = new MemoryCache({ maxSize: 5, ttlMs: 50 });
    shortTtlCache.set('tempKey', 'tempValue');

    expect(shortTtlCache.get('tempKey')).toBe('tempValue');

    // Wait for TTL expiration
    await new Promise(resolve => setTimeout(resolve, 60));

    expect(shortTtlCache.get('tempKey')).toBeNull();
    expect(shortTtlCache.misses).toBe(1);
  });

  test('computes accurate cache telemetry and hit ratio stats', () => {
    cache.set('k1', 'v1');
    cache.get('k1'); // hit
    cache.get('missing'); // miss

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRatio).toBe('50.0%');
  });
});
