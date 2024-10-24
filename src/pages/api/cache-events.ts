import { NextApiRequest, NextApiResponse } from 'next';
import { redis, checkCacheInvalidation } from '@/lib/redis';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Set up polling interval
    const interval = setInterval(async () => {
      const isInvalidated = await checkCacheInvalidation('tts-cache');
      if (isInvalidated) {
        res.write(`data: ${JSON.stringify({ type: 'cache-invalidated' })}\n\n`);
      }
    }, 5000); // Poll every 5 seconds

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  } catch (error) {
    console.error('Error setting up SSE:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
