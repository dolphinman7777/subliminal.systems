import { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const subscriber = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  await subscriber.subscribe('cache-invalidation');

  subscriber.on('message', (channel: string, message: string) => {
    if (channel === 'cache-invalidation') {
      res.write(`data: ${message}\n\n`);
    }
  });

  req.on('close', () => {
    subscriber.unsubscribe('cache-invalidation');
    subscriber.disconnect();
  });
}
