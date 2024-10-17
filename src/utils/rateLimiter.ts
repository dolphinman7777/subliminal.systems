import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const createRateLimiter = (points: number, duration: number) => {
  return {
    consume: async (key: string) => {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, duration);
      }
      if (current > points) {
        throw new Error('Rate limit exceeded');
      }
    }
  };
};

export const apiLimiter = createRateLimiter(5, 60); // 5 requests per 60 seconds
export const paypalLimiter = createRateLimiter(3, 60); // 3 requests per 60 seconds