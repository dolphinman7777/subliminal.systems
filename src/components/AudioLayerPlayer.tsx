import React, { useState } from 'react';

interface AudioLayerPlayerProps {
  onTrackSelect: (trackUrl: string | null) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

export function AudioLayerPlayer({ onTrackSelect, audioRef }: AudioLayerPlayerProps) {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  const handleTrackChange = (trackUrl: string) => {
    setSelectedTrack(trackUrl);
    onTrackSelect(trackUrl); // Ensure this is called with the correct track URL
    if (audioRef.current) {
      audioRef.current.src = trackUrl;
      audioRef.current.load();
    }
  };

  return (
    <div className="audio-layer-player">
      {/* ... existing JSX */}
      <audio ref={audioRef} src={selectedTrack || undefined} className="hidden" />
    </div>
  );
}
