import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface BackingTrack {
  name: string;
  url: string;
}

interface BackingTrackSelectorProps {
  onSelect: (track: BackingTrack) => void;
}

export function BackingTrackSelector({ onSelect }: BackingTrackSelectorProps) {
  const [tracks, setTracks] = useState<BackingTrack[]>([]);

  useEffect(() => {
    async function fetchTracks() {
      try {
        const response = await fetch('/api/backing-tracks');
        const data = await response.json();
        setTracks(data.tracks);
      } catch (error) {
        console.error('Error fetching backing tracks:', error);
      }
    }

    fetchTracks();
  }, []);

  return (
    <Select onValueChange={(value) => onSelect(JSON.parse(value))}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a backing track" />
      </SelectTrigger>
      <SelectContent>
        {tracks.map((track) => (
          <SelectItem key={track.url} value={JSON.stringify(track)}>
            {track.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
