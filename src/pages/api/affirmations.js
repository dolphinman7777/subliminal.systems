import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    const completion = await openai.createCompletion({
      model: 'text-davinci-002',
      prompt: `Generate 5 positive affirmations based on the following prompt: ${prompt}`,
      max_tokens: 200,
      n: 1,
      stop: null,
      temperature: 0.7,
    });

    const affirmations = completion.data.choices[0].text
      .split('\n')
      .filter(affirmation => affirmation.trim() !== '')
      .map(affirmation => affirmation.replace(/^\d+\.\s*/, '').trim());

    res.status(200).json(affirmations);
  } catch (error) {
    console.error('Error generating affirmations:', error);
    res.status(500).json({ message: 'Error generating affirmations' });
  }
}