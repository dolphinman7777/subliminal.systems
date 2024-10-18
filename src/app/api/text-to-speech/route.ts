import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { PollyClient, SynthesizeSpeechCommand, Engine, LanguageCode, OutputFormat, TextType, VoiceId } from "@aws-sdk/client-polly";
import { Readable } from 'stream';

const execAsync = promisify(exec);

const polly = new PollyClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const { text, voice = 'Joanna', volume = 1 } = await request.json();

    console.log('Received request:', { text: text.substring(0, 100), voice, volume });

    const params = {
      Text: text,
      OutputFormat: 'mp3' as OutputFormat,
      VoiceId: voice as VoiceId,
      Engine: 'neural' as Engine,
      LanguageCode: "en-US" as LanguageCode,
      TextType: "text" as TextType
    };

    console.log('Polly params:', params);

    const command = new SynthesizeSpeechCommand(params);
    const response = await polly.send(command);
    
    console.log('Polly response:', response);

    if (response.AudioStream instanceof Readable) {
      // Save the audio to a temporary file
      const tempFile = path.join(os.tmpdir(), `tts_${Date.now()}.mp3`);
      const fileHandle = await fs.open(tempFile, 'w');
      
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of response.AudioStream) {
          chunks.push(Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);
        await fs.writeFile(fileHandle, buffer);
      } finally {
        await fileHandle.close();
      }

      // Adjust volume using ffmpeg
      const outputFile = path.join(os.tmpdir(), `tts_adjusted_${Date.now()}.mp3`);
      await adjustVolume(tempFile, outputFile, volume);

      // Read the adjusted file
      const adjustedAudio = await fs.readFile(outputFile);

      // Clean up temporary files
      await Promise.all([
        fs.unlink(tempFile),
        fs.unlink(outputFile)
      ]);

      const audioBase64 = adjustedAudio.toString('base64');
      const audioUrl = `data:audio/mp3;base64,${audioBase64}`;
      return NextResponse.json({ audioUrl });
    } else {
      console.error('AudioStream is not a Readable stream:', response.AudioStream);
      throw new Error('Failed to generate audio: AudioStream is not a Readable stream');
    }
  } catch (error) {
    console.error('Error in TTS conversion:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: `Failed to convert text to speech: ${error.message}` }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }
}

async function adjustVolume(inputFile: string, outputFile: string, volume: number): Promise<void> {
  const command = `ffmpeg -i "${inputFile}" -filter:a "volume=${volume}" "${outputFile}"`;
  await execAsync(command);
}
