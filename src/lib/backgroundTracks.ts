import { BackgroundTrack } from '../types/backgroundTrack';

export const backgroundTracks: BackgroundTrack[] = [
  { 
    id: 'calm-waves', 
    name: 'Calm Waves', 
    url: `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/audio/background/calm-waves.mp3`, 
    duration: 900 
  },
  { 
    id: 'forest-ambience', 
    name: 'Forest Ambience', 
    url: `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/audio/background/forest-ambience.mp3`, 
    duration: 900 
  },
  { 
    id: 'gentle-rain', 
    name: 'Gentle Rain', 
    url: `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/audio/background/gentle-rain.mp3`, 
    duration: 900 
  },
  // Add more tracks as needed
];
