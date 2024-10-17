import React from 'react';

const LayoutSketch: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="bento-grid debug-grid">
        <div className="bento-affirmation-creator bg-blue-200 p-4 rounded-lg debug-box">
          <h2 className="text-xl font-bold mb-2">Affirmation Creator</h2>
          <p>Create your affirmations here.</p>
        </div>

        <div className="bento-generated-affirmations bg-green-200 p-4 rounded-lg debug-box">
          <h2 className="text-xl font-bold mb-2">Generated Affirmations</h2>
          <p>Your generated affirmations appear here.</p>
        </div>

        <div className="bento-subliminal-player bg-yellow-200 p-4 rounded-lg debug-box">
          <h2 className="text-xl font-bold mb-2">Subliminal Player</h2>
          <p>Play your subliminal audio here.</p>
        </div>

        <div className="bento-audio-layer bg-red-200 p-4 rounded-lg debug-box">
          <h2 className="text-xl font-bold mb-2">Audio Layer</h2>
          <p>Manage audio layers here.</p>
        </div>

        <div className="bento-audio-controls bg-purple-200 p-4 rounded-lg debug-box">
          <h2 className="text-xl font-bold mb-2">Audio Controls</h2>
          <p>Control your audio playback here.</p>
        </div>
      </div>
    </div>
  );
};

export default LayoutSketch;
