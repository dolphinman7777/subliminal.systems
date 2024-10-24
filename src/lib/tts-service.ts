import type { TTSJob, TTSJobResponse } from '@/types/tts'

export async function getJobStatus(jobId: string): Promise<TTSJob> {
  try {
    const response = await fetch(`/api/tts-status?jobId=${jobId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to get job status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createTTSJob(text: string): Promise<TTSJobResponse> {
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Failed to create TTS job: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
