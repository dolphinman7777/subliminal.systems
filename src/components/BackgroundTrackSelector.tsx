import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { backgroundTracks } from '@/lib/backgroundTracks';

interface BackgroundTrackSelectorProps {
  onSelect: (trackId: string) => void;
}

export function BackgroundTrackSelector({ onSelect }: BackgroundTrackSelectorProps) {
  return (
    <Select onValueChange={onSelect}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a background track" />
      </SelectTrigger>
      <SelectContent>
        {backgroundTracks.map((track) => (
          <SelectItem key={track.id} value={track.id}>
            {track.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
