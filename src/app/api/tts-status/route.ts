import { NextResponse } from 'next/server';
import { getTTSJobStatus } from '@/lib/tts-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }

  try {
    const status = await getTTSJobStatus(jobId);
    return NextResponse.json({ status });
  } catch (error) {
    console.error('Error checking TTS job status:', error);
    return NextResponse.json({ error: 'Failed to check job status' }, { status: 500 });
  }
}
