import { parentPort } from 'worker_threads';
import { getQueueResult, AFFIRMATION_QUEUE } from '../utils/queue';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { Redis } from '@upstash/redis';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface AffirmationMessage {
  prompt: string;
  id: string;
}

async function generateAffirmations(prompt: string): Promise<string[]> {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant that generates positive affirmations." },
      { role: "user", content: `Generate 5 positive affirmations based on the following prompt: ${prompt}` }
    ],
    max_tokens: 200,
  });

  return completion.choices[0].message.content
    ?.split('\n')
    .filter(affirmation => affirmation.trim() !== '')
    .map(affirmation => affirmation.replace(/^\d+\.\s*/, '').trim()) || [];
}

async function processQueue() {
  while (true) {
    const message = await getQueueResult(AFFIRMATION_QUEUE) as AffirmationMessage | null;
    if (message) {
      const { prompt, id } = message;
      try {
        const affirmations = await generateAffirmations(prompt);
        // Store the result in Redis or your database
        await redis.set(`affirmation_result:${id}`, JSON.stringify(affirmations));
      } catch (error) {
        console.error('Error processing affirmation:', error);
        // Handle error (e.g., retry logic, dead-letter queue)
      }
    }
    // Wait for a short time before checking for new jobs
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

processQueue().catch(console.error);

if (parentPort) {
  parentPort.on('message', (message) => {
    if (message === 'exit') {
      console.log('Worker exiting...');
      process.exit(0);
    }
  });
}
