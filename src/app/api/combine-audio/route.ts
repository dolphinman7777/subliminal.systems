import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { execFile } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import { PollyClient, SynthesizeSpeechCommand, Engine, LanguageCode, OutputFormat, TextType, VoiceId } from "@aws-sdk/client-polly";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const execFileAsync = promisify(execFile);

const polly = new PollyClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Set the path to the local ffmpeg binary
const ffmpegPath = path.resolve(__dirname, '../../../bin/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

export async function POST(request: Request) {
  try {
    console.log('Starting audio combination process...');
    
    // Use the manually set path if ffmpegPath is not valid
    const effectiveFfmpegPath = manualFfmpegPath || process.env.FFMPEG_PATH || ffmpegPath;
    console.log('FFmpeg path:', effectiveFfmpegPath);
    if (!effectiveFfmpegPath) {
      console.error('FFmpeg path is not set. Please check the ffmpeg-static installation.');
      return NextResponse.json({ 
        error: 'FFmpeg path is not set. Please check the ffmpeg-static installation.'
      }, { status: 500 });
    }

    // Test ffmpeg installation
    try {
      const { stdout } = await execFileAsync(effectiveFfmpegPath, ['-version']);
      console.log('FFmpeg version:', stdout);
    } catch (error) {
      console.error('Error testing ffmpeg:', error);
      return NextResponse.json({ 
        error: 'FFmpeg not available',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    const { 
      text, 
      selectedBackingTrack, 
      ttsVolume, 
      backingTrackVolume, 
      trackDuration: requestTrackDuration, 
      ttsSpeed,
      ttsDuration
    } = await request.json();

    console.log('Received parameters:', {
      text, selectedBackingTrack, ttsVolume, backingTrackVolume, requestTrackDuration, ttsSpeed, ttsDuration
    });

    // Validate parameters
    if (
      !text || typeof text !== 'string' || 
      !selectedBackingTrack || typeof selectedBackingTrack !== 'string' || 
      typeof ttsVolume !== 'number' || 
      typeof backingTrackVolume !== 'number' || 
      typeof requestTrackDuration !== 'number' || 
      typeof ttsSpeed !== 'number' || 
      typeof ttsDuration !== 'number'
    ) {
      console.error('Invalid parameters:', { 
        text: typeof text, 
        selectedBackingTrack: typeof selectedBackingTrack, 
        ttsVolume: typeof ttsVolume, 
        backingTrackVolume: typeof backingTrackVolume, 
        trackDuration: typeof requestTrackDuration, 
        ttsSpeed: typeof ttsSpeed, 
        ttsDuration: typeof ttsDuration 
      });
      return NextResponse.json({ error: 'Invalid or missing audio parameters.' }, { status: 400 });
    }

    // Additional validations
    if (ttsSpeed < 0.5 || ttsSpeed > 4.0) {
      throw new Error('TTS speed must be between 0.5x and 4.0x.');
    }

    if (ttsDuration > requestTrackDuration) {
      throw new Error('TTS duration cannot exceed track duration.');
    }

    const textToGenerate = text.repeat(Math.ceil(900 / ttsDuration));
    let ttsAudioUrl: string;
    if (text.startsWith('data:audio')) {
      console.log('TTS audio already provided, skipping generation...');
      ttsAudioUrl = text;
    } else {
      console.log('Generating TTS audio...');
      ttsAudioUrl = await generatePollyTTS(textToGenerate);
    }
    console.log('TTS audio URL:', ttsAudioUrl);

    console.log('Downloading TTS audio...');
    const ttsAudioPath = await downloadAudio(ttsAudioUrl, 'tts');
    console.log('TTS audio downloaded:', ttsAudioPath);

    console.log('Downloading backing track...');
    let backingTrackPath: string;
    if (selectedBackingTrack === 'present') {
      backingTrackPath = path.join(os.tmpdir(), 'silent.mp3');
      await createSilentAudio(effectiveFfmpegPath, backingTrackPath, requestTrackDuration);
    } else {
      backingTrackPath = await downloadAudio(selectedBackingTrack, 'backing');
    }
    console.log('Backing track downloaded:', backingTrackPath);

    console.log('Mixing audio...');
    const outputPath = path.join(os.tmpdir(), `combined_${Date.now()}.mp3`);
    await mixAudio(effectiveFfmpegPath, ttsAudioPath, backingTrackPath, ttsVolume, backingTrackVolume, requestTrackDuration, ttsSpeed, ttsDuration, outputPath);
    console.log('Audio mixed successfully');

    console.log('Reading mixed audio file...');
    const mixedAudioBuffer = await fs.readFile(outputPath);
    console.log('Mixed audio file read, size:', mixedAudioBuffer.length);

    // Clean up temporary files
    await Promise.all([
      fs.unlink(ttsAudioPath),
      fs.unlink(backingTrackPath),
      fs.unlink(outputPath)
    ]);

    console.log('Sending audio response...');
    return new NextResponse(mixedAudioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="combined_affirmation_audio.mp3"`,
      },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function generatePollyTTS(text: string): Promise<string> {
  const MAX_TEXT_LENGTH = 3000;
  const audioUrls: string[] = [];

  const textChunks = [];
  for (let i = 0; i < text.length; i += MAX_TEXT_LENGTH) {
    textChunks.push(text.slice(i, i + MAX_TEXT_LENGTH));
  }

  for (const chunk of textChunks) {
    const params = {
      Engine: "neural" as Engine,
      LanguageCode: "en-US" as LanguageCode,
      Text: chunk,
      TextType: "text" as TextType,
      OutputFormat: "mp3" as OutputFormat,
      VoiceId: "Joanna" as VoiceId,
    };

    const command = new SynthesizeSpeechCommand(params);
    const { AudioStream } = await polly.send(command);

    if (!AudioStream) {
      throw new Error('Failed to generate audio with Polly');
    }

    const buffer = await AudioStream.transformToByteArray();
    const fileName = `tts_${Date.now()}_${audioUrls.length}.mp3`;

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: 'audio/mpeg'
    }));

    audioUrls.push(`https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`);
  }

  return audioUrls.join(',');
}

async function downloadAudio(url: string, prefix: string): Promise<string> {
  try {
    if (url.startsWith('data:')) {
      const base64Data = url.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const tempPath = path.join(os.tmpdir(), `${prefix}_${Date.now()}.mp3`);
      await fs.writeFile(tempPath, buffer);
      return tempPath;
    } else {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${prefix} audio. Status: ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      const tempPath = path.join(os.tmpdir(), `${prefix}_${Date.now()}.mp3`);
      await fs.writeFile(tempPath, Buffer.from(buffer));
      return tempPath;
    }
  } catch (error: unknown) {
    console.error(`Error downloading ${prefix} audio:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to download ${prefix} audio: ${error.message}`);
    } else {
      throw new Error(`Failed to download ${prefix} audio: Unknown error`);
    }
  }
}

async function createSilentAudio(effectiveFfmpegPath: string, outputPath: string, duration: number): Promise<void> {
  const args = ['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', duration.toString(), '-q:a', '9', '-acodec', 'libmp3lame', outputPath];
  await execFileAsync(effectiveFfmpegPath, args);
}

async function mixAudio(
  effectiveFfmpegPath: string,
  ttsPath: string,
  backingPath: string,
  ttsVolume: number,
  backingTrackVolume: number,
  trackDuration: number,
  ttsSpeed: number,
  ttsDuration: number,
  outputPath: string
): Promise<void> {
  console.log('Mixing audio with parameters:', {
    ttsVolume,
    backingTrackVolume,
    trackDuration,
    ttsSpeed,
    ttsDuration
  });

  const ttsVolumeDb = Math.log10(ttsVolume) * 20;
  const backingVolumeDb = Math.log10(backingTrackVolume) * 20;
  const loopCount = Math.ceil(trackDuration / (ttsDuration / ttsSpeed));

  const args = [
    '-i', ttsPath,
    '-stream_loop', '-1',
    '-i', backingPath,
    '-filter_complex', `[0:a]atempo=${ttsSpeed},volume=${ttsVolumeDb}dB,aloop=loop=${loopCount}:size=${Math.floor(ttsDuration * 48000)}[a];[1:a]volume=${backingVolumeDb}dB[b];[a][b]amix=inputs=2:duration=longest:weights=${ttsVolume} ${backingTrackVolume},asetpts=PTS-STARTPTS,atrim=0:${trackDuration}`,
    '-ar', '48000',
    '-acodec', 'libmp3lame',
    '-b:a', '192k',
    outputPath
  ];

  await execFileAsync(effectiveFfmpegPath, args);
}
