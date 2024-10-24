import React, { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PlayIcon, PauseIcon, Volume2 } from 'lucide-react';

interface SubliminalAudioPlayerProps {
  audioUrl: string | null;
  isLoading: boolean;
  trackDuration: number;
  ttsDuration: number;
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  onPlayPause: () => void;
  currentTime: number;
  volume: number;
  onVolumeChange: (value: number) => void;
  playbackRate: number;
  onTimeUpdate: () => void;
}

export function SubliminalAudioPlayer({
  audioUrl,
  isLoading,
  trackDuration,
  ttsDuration,
  audioRef,
  isPlaying,
  onPlayPause,
  currentTime,
  volume,
  onVolumeChange,
  playbackRate,
  onTimeUpdate
}: SubliminalAudioPlayerProps) {

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      console.log('SubliminalAudioPlayer: Playback rate set to:', playbackRate);
      
      // If audio is already playing, restart it to apply the new rate
      if (!audioRef.current.paused) {
        const currentTime = audioRef.current.currentTime;
        audioRef.current.currentTime = 0;
        audioRef.current.play().then(() => {
          audioRef.current!.currentTime = currentTime;
        }).catch(error => console.error('Error restarting audio:', error));
      }
    }
  }, [playbackRate, audioRef]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="subliminal-audio-player">
      <h2 className="text-xl font-semibold mb-4">
        <span className="text-green-500 glow-effect">Audio</span>firmations
      </h2>
      
      <div className="bg-white p-4 rounded-xl shadow-md mb-4 flex flex-col justify-between h-[200px]">
        <div className="flex justify-between text-sm">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(trackDuration)}</span>
        </div>
        
        <div className="flex justify-center items-center">
          <Button
            onClick={onPlayPause}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-green-500 hover:bg-green-600 text-white"
            disabled={!audioUrl || isLoading}
          >
            {isPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Volume2 className="h-5 w-5 text-green-500" />
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            onValueChange={(value) => onVolumeChange(value[0])}
            className="w-full"
          />
        </div>

        <div className="text-sm text-gray-500">
          Playback Speed: {playbackRate.toFixed(2)}x
          {playbackRate >= 4.0 && " (Max)"}
          {playbackRate <= 0.25 && " (Min)"}
        </div>
      </div>
      
      <audio 
        ref={audioRef}
        src={audioUrl || undefined}
        onTimeUpdate={onTimeUpdate}
        loop={false}
        className="hidden"
      />
    </div>
  );
}
