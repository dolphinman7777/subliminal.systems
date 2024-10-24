import NodeCache from 'node-cache';
import { Redis } from '@upstash/redis';
import { publishCacheInvalidation } from './pubsub'; // Implement this function

const cache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes by default
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export function setCachedData<T>(key: string, data: T, ttl?: number): void {
  if (ttl !== undefined) {
    cache.set(key, data, ttl);
  } else {
    cache.set(key, data);
  }
}

export function clearAllCache(): void {
  cache.flushAll();
}

export async function cacheData(key: string, data: any, expirationInSeconds: number = 3600) {
  await redis.set(key, JSON.stringify(data), { ex: expirationInSeconds });
}

export async function getCachedData(key: string) {
  const data = await redis.get(key);
  return data ? JSON.parse(data as string) : null;
}

// Modify the Redis invalidateCache function to return a boolean
export async function invalidateCache(key: string): Promise<boolean> {
  const result = await redis.del(key);
  await publishCacheInvalidation(key);
  return result > 0;
}

// Modify the Redis invalidateCachePattern function
export async function invalidateCachePattern(pattern: string): Promise<number> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    const result = await redis.del(...keys);  // Use spread operator here
    for (const key of keys) {
      await publishCacheInvalidation(key);
    }
    return result;
  }
  return 0;
}
