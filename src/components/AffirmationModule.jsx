import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';

export default function AffirmationModule() {
  const [prompt, setPrompt] = useState('');
  const [prompts, setPrompts] = useState([]);
  const [generatedAffirmations, setGeneratedAffirmations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddPrompt = () => {
    if (prompt.trim()) {
      setPrompts([...prompts, prompt.trim()]);
      setPrompt('');
    }
  };

  const handleRemovePrompt = (index) => {
    setPrompts(prompts.filter((_, i) => i !== index));
  };

  const handleGenerateAffirmation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-affirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompts.join(', ') }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate affirmation');
      }

      const data = await response.json();
      setGeneratedAffirmations([...generatedAffirmations, data.affirmation]);
    } catch (error) {
      console.error('Error:', error);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Affirmation Search</h2>
        <div className="flex space-x-2 mb-4">
          <Input
            type="text"
            placeholder="Enter your prompt..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddPrompt()}
          />
          <Button onClick={handleAddPrompt}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {prompts.map((p, index) => (
            <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center">
              {p}
              <button onClick={() => handleRemovePrompt(index)} className="ml-2 text-purple-600 hover:text-purple-800">
                ×
              </button>
            </span>
          ))}
        </div>
        <Button 
          onClick={handleGenerateAffirmation} 
          disabled={isLoading || prompts.length === 0}
          className="w-full"
        >
          {isLoading ? 'Generating...' : 'Generate Affirmation'}
        </Button>
      </div>

      {generatedAffirmations.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Generated Affirmations</h2>
          <div className="space-y-2">
            {generatedAffirmations.map((affirmation, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-md">
                {affirmation}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}