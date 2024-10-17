import { NextApiRequest, NextApiResponse } from 'next';
import { invalidateCache } from '@/utils/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ... payment processing logic ...

  const paymentSuccessful = true; // Replace with actual payment processing logic
  const userId = 'user123'; // Replace with actual user ID retrieval logic

  if (paymentSuccessful) {
    await invalidateCache(`user:${userId}`);
    // Instruct client to clear its cache
    res.status(200).json({ success: true, clearCache: true });
  } else {
    res.status(400).json({ success: false, message: 'Payment failed' });
  }
}
