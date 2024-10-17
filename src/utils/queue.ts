import { Redis } from '@upstash/redis';
import Queue from 'bull';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const AFFIRMATION_QUEUE = 'affirmation-queue';
export const PAYPAL_ORDER_QUEUE = 'paypal-order-queue';

export const paypalOrderQueue = new Queue(PAYPAL_ORDER_QUEUE, process.env.REDIS_URL!);

export async function addToQueue(queueName: string, data: unknown): Promise<number> {
  return await redis.lpush(queueName, JSON.stringify(data));
}

export async function getQueueResult(queueName: string): Promise<unknown | null> {
  const result = await redis.rpop(queueName);
  return result ? JSON.parse(result) : null;
}

export { redis };
