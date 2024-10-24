import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL) {
  throw new Error('UPSTASH_REDIS_REST_URL is not defined')
}

if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('UPSTASH_REDIS_REST_TOKEN is not defined')
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// For cache invalidation, we'll use a polling approach with Upstash
export async function invalidateCache(key: string): Promise<void> {
  await redis.del(key);
  await redis.set(`cache:invalidated:${key}`, Date.now());
}

export async function checkCacheInvalidation(key: string): Promise<boolean> {
  const lastInvalidated = await redis.get(`cache:invalidated:${key}`);
  return !!lastInvalidated;
}

export const createRedisSubscriber = () => {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
};
