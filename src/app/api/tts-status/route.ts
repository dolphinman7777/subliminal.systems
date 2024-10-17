import { NextResponse } from 'next/server';
import { getJobStatus } from '@/lib/tts-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ message: 'Missing jobId' }, { status: 400 });
  }

  try {
    const status = await getJobStatus(jobId);
    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    console.error('Error fetching TTS job status:', error);
    return NextResponse.json({ message: 'Error fetching TTS job status' }, { status: 500 });
  }
}