import { NextResponse } from 'next/server';
import { getQueueResult, AFFIRMATION_QUEUE } from '../../../utils/queue';

export async function GET(req: Request) {
  try {
    const result = await getQueueResult(AFFIRMATION_QUEUE);
    if (result) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ status: 'pending' });
    }
  } catch (error: any) {
    console.error('Error fetching affirmation result:', error.message);
    return NextResponse.json({ error: 'Failed to fetch affirmation result', details: error.message }, { status: 500 });
  }
}