import React, { useState } from 'react';
// ... other imports

interface StudioProps {
  affirmationText: string;
  onTTSComplete: (audioUrl: string) => void;
}

export function Studio({ affirmationText, onTTSComplete }: StudioProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);

  async function handleTTSConversion() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: affirmationText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setTtsAudioUrl(audioUrl);
      onTTSComplete(audioUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      {error && <div className="text-red-500">{error}</div>}
      {isLoading ? (
        <div>Converting text to speech...</div>
      ) : (
        <button onClick={handleTTSConversion}>
          Convert to Speech
        </button>
      )}
      {ttsAudioUrl && (
        <audio controls src={ttsAudioUrl}>
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
}
