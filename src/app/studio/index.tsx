import React, { useState } from 'react';
// ... other imports

export function Studio() {
  // ... other state variables
  const [error, setError] = useState<string | null>(null);

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
    } catch (error) {
      console.error('TTS conversion failed:', error);
      setError(`TTS conversion failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }

  // ... rest of the component

  return (
    <div>
      {/* ... other JSX */}
      {error && <div className="text-red-500">{error}</div>}
      {/* ... other JSX */}
    </div>
  );
}
