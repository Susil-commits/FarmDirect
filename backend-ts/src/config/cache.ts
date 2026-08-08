/**
 * Simple In-Memory LRU Cache with TTL
 * 
 * Used to mimic a Redis layer to protect the database from read-heavy bursts
 * (e.g. users repeatedly querying crop listings).
 */

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

export class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly maxSize: number;
  private readonly defaultTTLMs: number;

  constructor(maxSize: number = 1000, defaultTTLSeconds: number = 60) {
    this.maxSize = maxSize;
    this.defaultTTLMs = defaultTTLSeconds * 1000;
  }

  set<T>(key: string, value: T, ttlSeconds?: number): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    const expiry = Date.now() + (ttlSeconds ? ttlSeconds * 1000 : this.defaultTTLMs);
    this.cache.set(key, { value, expiry });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear all cache entries that start with a certain prefix (useful for invalidation)
  clearPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

export const globalCache = new SimpleCache(1000, 120);
