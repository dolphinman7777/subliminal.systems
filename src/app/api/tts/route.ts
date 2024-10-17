import { NextResponse } from 'next/server';
import { PollyClient, SynthesizeSpeechCommand, Engine, SynthesizeSpeechCommandInput } from "@aws-sdk/client-polly";

const polly = new PollyClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

console.log('AWS Region:', process.env.AWS_REGION);
console.log('AWS Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set');
console.log('AWS Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing text parameter' }, { status: 400 });
    }

    const params: SynthesizeSpeechCommandInput = {
      Engine: "neural",
      LanguageCode: "en-US",
      Text: text,
      TextType: "text",
      OutputFormat: "mp3",
      VoiceId: "Joanna",
    };

    const command = new SynthesizeSpeechCommand(params);
    const { AudioStream } = await polly.send(command);

    if (!AudioStream) {
      throw new Error('Failed to generate audio stream');
    }

    const buffer = await AudioStream.transformToByteArray();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="tts_audio.mp3"',
      },
    });
  } catch (error) {
    console.error('Error in TTS generation:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: `TTS generation failed: ${error.message}` }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred during TTS generation' }, { status: 500 });
    }
  }
}
