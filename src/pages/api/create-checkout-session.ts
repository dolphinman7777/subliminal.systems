import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import { spawn } from 'child_process';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia',
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
}

export const maxDuration = 10; // Set to 10 seconds

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { audioDetails, email } = req.body;

    // Generate a unique identifier for this audio
    const audioId = uuidv4();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Subliminal Audio',
            },
            unit_amount: 300, // €3.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&audio_id=${audioId}`,
      cancel_url: `${req.headers.origin}/studio`,
      customer_email: email,
      metadata: {
        audioId,
        selectedBackingTrack: audioDetails.selectedBackingTrack,
        ttsVolume: audioDetails.ttsVolume.toString(),
        backingTrackVolume: audioDetails.backingTrackVolume.toString(),
        trackDuration: audioDetails.trackDuration.toString(),
        ttsDuration: audioDetails.ttsDuration.toString(),
        playbackRate: audioDetails.playbackRate.toString(),
      },
    });

    console.log('Stripe session created:', session.id);
    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ message: 'Error creating checkout session' });
  }
}
