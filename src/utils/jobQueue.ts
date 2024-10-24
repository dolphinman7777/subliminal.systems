import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';
import { TTSJob } from '@/types/api';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const TTS_QUEUE = 'tts-processing';

const jobQueue: TTSJob[] = []

// Initialize the ttsQueue
const ttsQueue = {
  add: async (job: { text: string; userId: string }) => {
    const jobId = uuidv4();
    const jobData = { id: jobId, ...job, status: 'pending' };
    await redis.lpush(TTS_QUEUE, JSON.stringify(jobData));
    return jobId;
  },
  getJob: async (jobId: string) => {
    const jobs = await redis.lrange(TTS_QUEUE, 0, -1);
    for (const jobString of jobs) {
      const job = JSON.parse(jobString);
      if (job.id === jobId) {
        return job;
      }
    }
    return null;
  },
  process: async (callback: (job: TTSJob) => Promise<void>) => {
    while (true) {
      const jobString = await redis.rpop(TTS_QUEUE);
      if (!jobString) {
        // No jobs in the queue, wait before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      const job = JSON.parse(jobString) as TTSJob;
      console.log(`Processing job ${job.id}`);

      try {
        await callback(job);
        
        // Update job status
        job.status = 'completed';
        
        // Store the completed job
        await redis.set(`job:${job.id}`, JSON.stringify(job));
        
        console.log(`Job ${job.id} completed`);
      } catch (error: any) {
        console.error(`Error processing job ${job.id}:`, error);
        job.status = 'failed';
        job.error = error.message;
        await redis.set(`job:${job.id}`, JSON.stringify(job));
      }
    }
  },
};

export const addJobToQueue = async (text: string, userId: string): Promise<string> => {
  const jobId = generateJobId()
  
  // Create job object that matches TTSJob interface exactly
  const newJob: TTSJob = {
    id: jobId,
    status: 'pending',  // Changed from 'processing' to 'pending' to match typical flow
    text: text,         // Explicitly assign text
    userId: userId,     // Explicitly assign userId
  }

  jobQueue.push(newJob)

  // Simulate background processing
  processJob(newJob)

  return jobId
};

export const getJobStatus = async (jobId: string): Promise<TTSJob | null> => {
  try {
    console.log(`Fetching status for job ${jobId}`);
    const jobString = await redis.get(`job:${jobId}`);
    if (!jobString) {
      console.log(`Job ${jobId} not found`);
      return null;
    }
    // Parse the string we know exists
    const job = JSON.parse(jobString as string) as TTSJob;
    console.log(`Found job ${jobId}, status: ${job.status}`);
    return job;
  } catch (error) {
    console.error(`Error getting job status for ${jobId}:`, error);
    throw error;
  }
};

// This function should be called by a separate worker process
export const processJobs = async () => {
  while (true) {
    const jobString = await redis.rpop(TTS_QUEUE);
    if (!jobString) {
      // No jobs in the queue, wait before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }

    const job = JSON.parse(jobString);
    console.log(`Processing job ${job.id}`);

    try {
      // Simulate TTS processing
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Update job status
      job.status = 'completed';
      job.audioUrl = `https://example.com/audio/${job.id}.mp3`;
      
      // Store the completed job
      await redis.set(`job:${job.id}`, JSON.stringify(job));
      
      console.log(`Job ${job.id} completed`);
    } catch (error: any) {
      console.error(`Error processing job ${job.id}:`, error);
      job.status = 'failed';
      job.error = error.message;
      await redis.set(`job:${job.id}`, JSON.stringify(job));
    }
  }
};

function generateJobId(): string {
  return Math.random().toString(36).substr(2, 9)
}

async function processJob(job: TTSJob): Promise<void> {
  try {
    // Simulate TTS processing delay
    await new Promise(resolve => setTimeout(resolve, 5000))

    // TODO: Integrate with ElevenLabs API or your preferred TTS service
    // For demonstration, we'll mark it as completed with a mock audio URL
    job.status = 'completed'
    job.audioUrl = 'https://example.com/audio.mp3'
  } catch (error) {
    console.error('Error processing TTS job:', error)
    job.status = 'failed'
  }
}

export { redis, ttsQueue };
