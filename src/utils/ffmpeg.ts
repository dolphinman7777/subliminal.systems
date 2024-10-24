import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { existsSync } from 'fs';

export function getFFmpegPath(): string {
  // First try the ffmpeg-static path
  if (ffmpegStatic && existsSync(ffmpegStatic)) {
    return ffmpegStatic;
  }

  // Check if ffmpeg is available in the system PATH
  try {
    return 'ffmpeg';
  } catch (error) {
    console.error('Error finding ffmpeg:', error);
    throw new Error('FFmpeg not found in system');
  }
}

// Configure ffmpeg with the correct path
ffmpeg.setFfmpegPath(getFFmpegPath());
