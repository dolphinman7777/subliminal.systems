import { NextResponse } from 'next/server';
import { addJobToQueue } from '@/utils/jobQueue';

export async function POST(request: Request) {
  try {
    const { text, userId } = await request.json()

    if (!text) {
      return NextResponse.json({ message: 'Text is required' }, { status: 400 })
    }

    // Add job to the queue
    const jobId = await addJobToQueue(text, userId)

    return NextResponse.json({ jobId }, { status: 200 })
  } catch (error) {
    console.error('Error queuing TTS job:', error)
    return NextResponse.json({ message: 'Error queuing TTS job' }, { status: 500 })
  }
}