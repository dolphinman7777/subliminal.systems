import { NextResponse } from 'next/server';
import { PollyClient, SynthesizeSpeechCommand, Engine, LanguageCode, OutputFormat, TextType, VoiceId } from "@aws-sdk/client-polly";
import { Readable } from 'stream';

// Initialize Polly client
const polly = new PollyClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const { text, voice = 'Joanna' } = await request.json();

    const params = {
      Text: text,
      OutputFormat: 'mp3' as OutputFormat,
      VoiceId: voice as VoiceId,
      Engine: 'neural' as Engine,
      LanguageCode: "en-US" as LanguageCode,
      TextType: "text" as TextType
    };

    const command = new SynthesizeSpeechCommand(params);
    const response = await polly.send(command);

    if (response.AudioStream instanceof Readable) {
      // Convert the audio stream to a buffer
      const chunks: Buffer[] = [];
      for await (const chunk of response.AudioStream) {
        chunks.push(Buffer.from(chunk));
      }
      const audioBuffer = Buffer.concat(chunks);
      
      // Convert to base64 and create data URL
      const audioBase64 = audioBuffer.toString('base64');
      const audioUrl = `data:audio/mp3;base64,${audioBase64}`;
      
      return NextResponse.json({ audioUrl });
    } else {
      throw new Error('Failed to generate audio: AudioStream is not a Readable stream');
    }
  } catch (error) {
    console.error('Error in TTS conversion:', error);
    return NextResponse.json(
      { error: 'Failed to convert text to speech' }, 
      { status: 500 }
    );
  }
}
