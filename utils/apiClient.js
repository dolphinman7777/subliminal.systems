export async function fetchAffirmations(prompt) {
  const response = await fetch('/api/affirmations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch affirmations');
  }

  return response.json();
}