import React, { useState } from 'react';
// ... other imports

export default function StudioPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [affirmationText, setAffirmationText] = useState('');
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
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }

  // ... rest of the component

  return (
    <div>
      {/* ... other JSX */}
      <textarea
        value={affirmationText}
        onChange={(e) => setAffirmationText(e.target.value)}
        placeholder="Enter your affirmation text"
      />
      <button onClick={handleTTSConversion} disabled={isLoading}>
        {isLoading ? 'Converting...' : 'Convert to Speech'}
      </button>
      {error && <div className="text-red-500">{error}</div>}
      {ttsAudioUrl && <audio src={ttsAudioUrl} controls />}
      {/* ... other JSX */}
    </div>
  );
}
