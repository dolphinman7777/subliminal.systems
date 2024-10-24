import { Redis } from '@upstash/redis';

const pubClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function publishCacheInvalidation(key: string) {
  await pubClient.publish('cache-invalidation', key);
}