import React, { useState, useRef, useEffect } from 'react';
import { BackingTrackSelector } from './BackingTrackSelector';
import { SubliminalAudioPlayer } from './SubliminalAudioPlayer';

interface BackingTrack {
  name: string;
  url: string;
}

interface AudioModuleProps {
  affirmationAudio: string;
  ttsVolume: number;
  backingTrackVolume: number;
  trackDuration: number;
  ttsSpeed: number;
  ttsDuration: number;
}

export function AudioModule({
  affirmationAudio,
  ttsVolume,
  backingTrackVolume,
  trackDuration,
  ttsSpeed,
  ttsDuration
}: AudioModuleProps) {
  const [selectedBackingTrack, setSelectedBackingTrack] = useState<BackingTrack | null>(null);
  const [mixedAudioUrl, setMixedAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(ttsVolume);
  const [playbackRate, setPlaybackRate] = useState(ttsSpeed);

  const audioRef = useRef<HTMLAudioElement>(null);

  const handleBackingTrackSelect = (track: BackingTrack) => {
    setSelectedBackingTrack(track);
    mixAudio(affirmationAudio, track.url);
  };

  const mixAudio = async (affirmationAudioUrl: string, backingTrackUrl: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/combine-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ttsAudioUrl: affirmationAudioUrl,
          selectedBackingTrack: backingTrackUrl,
          ttsVolume,
          backingTrackVolume,
          trackDuration,
          ttsSpeed,
          ttsDuration
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mix audio');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setMixedAudioUrl(url);
    } catch (error) {
      console.error('Error mixing audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => console.error('Error playing audio:', error));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = false; // Ensure the audio doesn't loop on its own
    }
  }, [mixedAudioUrl]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      // If we've reached the end of the track, reset to the beginning
      if (audioRef.current.currentTime >= trackDuration) {
        audioRef.current.currentTime = 0;
        if (isPlaying) {
          audioRef.current.play().catch(error => console.error('Error restarting audio:', error));
        }
      }
    }
  };

  return (
    <div>
      <BackingTrackSelector onSelect={handleBackingTrackSelect} />
      {mixedAudioUrl && (
        <SubliminalAudioPlayer 
          audioUrl={mixedAudioUrl}
          isLoading={isLoading}
          trackDuration={trackDuration}
          ttsDuration={ttsDuration}
          audioRef={audioRef}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          currentTime={currentTime}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          playbackRate={playbackRate}
          onTimeUpdate={handleTimeUpdate}
        />
      )}
    </div>
  );
}
