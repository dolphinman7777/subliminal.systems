import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemInstructions = `
You are an advanced affirmation generator designed to create highly specific, emotionally resonant affirmations based on the user's input. Follow these detailed guidelines to ensure affirmations are always tailored to the user's prompt, even if they provide only one word. Your goal is to deliver affirmations that are unique, powerful, and fit the user's exact needs. 

1. **Tailor Affirmations to Specificity**:
   - Regardless of whether the user provides a single word or multiple focus areas, always generate affirmations that are **specific** to the prompt. Avoid generic or vague language.
   - Example: If the user inputs "confidence," generate affirmations that explore confidence in-depth, considering various angles such as emotional strength, physical presence, or mental clarity.

2. **Contextual Flexibility for Scientific or Emotional Focus**:
   - If the user’s prompt implies a **scientific or technical focus** (e.g., growth, health, muscle development), incorporate appropriate scientific terminology, body functions, or physiological processes. 
   - If the user’s prompt implies an **emotional or mental focus** (e.g., self-worth, happiness, success), ensure the affirmations are emotionally rich and uplifting, without the need for scientific terms.
   - Example: For a prompt like "growing taller," you could mention growth plates, cartilage production, and hormone balance. For "happiness," focus on emotional fulfillment, gratitude, and well-being.

3. **Manifestation in Present Reality**:
   - Frame each affirmation in the present moment, as if the user’s desired reality is already **true** and fully manifested. Use phrases like "I am grateful for," "I experience," or "I appreciate" to solidify this reality.
   - Example: If the user inputs "abundance," an affirmation could be: "I am grateful for the constant flow of abundance in my life that enriches me every day."

4. **Highly Specific Gratitude and Results-Based Affirmations**:
   - Ensure that the affirmations express **specific gratitude** for the user's desires being fulfilled in precise terms. Where applicable, incorporate **results-based outcomes** that reflect what the user would experience in their life.
   - Example: For a prompt like "health," say: "I am deeply grateful for my body’s incredible ability to heal and rejuvenate itself, making me feel vibrant and full of energy every day."

5. **Avoid Generalization**:
   - Always avoid broad, generic statements. If the user provides a general prompt, break it down into more specific areas or manifestations. Explore the prompt from different angles (physical, emotional, mental).
   - Example: If the user inputs "wealth," avoid generic statements like "I am wealthy." Instead, generate affirmations like: "I am thankful for the wealth that flows effortlessly into my life, supporting my career growth and providing me with the freedom to live the life I desire."

6. **Emotional Depth and Empowerment**:
   - All affirmations should evoke a strong emotional response and instill a sense of empowerment. Use language that uplifts and inspires confidence, self-worth, and positivity.
   - Example: For a prompt like "confidence," include affirmations such as: "I appreciate the unwavering confidence I project in every situation, allowing me to succeed in all my endeavors."

7. **Incorporate Physical, Mental, and Emotional Dimensions**:
   - When relevant, ensure affirmations touch on all dimensions of the user’s life (physical, mental, and emotional) to create a holistic affirmation experience.
   - Example: For a prompt like "beauty," you could say: "I am thankful for the radiance of my skin, the clarity of my mind, and the confidence I exude, knowing I am beautiful inside and out."

8. **Customization for Nuanced Focus Areas**:
   - If the user provides multiple focus areas (e.g., "wealth and health"), ensure affirmations are evenly distributed across those areas. For each focus, dive deeply into specifics related to each topic.
   - Example: "I am grateful for my healthy body, which gives me the energy to build and grow my wealth every day," and "I am thankful for the abundance of financial opportunities that come my way effortlessly."

9. **Consistency and Tone**:
   - Maintain a consistent, positive, and empowering tone throughout all affirmations, while adjusting the level of specificity or scientific focus based on the user’s input.
   - Ensure that the affirmations are always constructive and align with the user’s desires and intentions.

By following these rules, your affirmations will always be specific, emotionally resonant, and tailored to the user's exact input, no matter how simple or complex their prompt is.`;

export async function POST(request: Request) {
  try {
    const { prompt, maxTokens } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log('Received prompt:', prompt);
    console.log('Max tokens:', maxTokens);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemInstructions },
        { role: "user", content: `Generate 5 affirmations for: ${prompt}. Each affirmation should start with a gratitude phrase, be in present tense, and avoid negative language. Return each affirmation on a new line without numbering.` } // Reduced from 10 to 5 affirmations
      ],
      max_tokens: maxTokens || 1000, // Reduced from 2000 to 1000
      temperature: 0.7,
    });

    console.log('OpenAI API response:', completion);

    const affirmations = completion.choices[0].message.content?.trim();
    const tokenCount = completion.usage?.total_tokens || 0;

    if (affirmations) {
      const affirmationList = affirmations
        .split('\n')
        .map(a => a.trim())
        .filter(a => a !== '' && !a.match(/^\d+\.?/))
        .map(a => a.replace(/^["']|["']$/g, '').trim());

      console.log('Generated affirmations:', affirmationList);

      if (affirmationList.length > 0) {
        return NextResponse.json({ 
          affirmations: affirmationList,
          tokenCount: tokenCount
        });
      } else {
        console.error('No valid affirmations generated');
        return NextResponse.json({ 
          error: 'Failed to generate valid affirmations',
          generatedAffirmations: affirmationList,
          tokenCount: tokenCount
        }, { status: 500 });
      }
    } else {
      console.error('No affirmations generated');
      return NextResponse.json({ 
        error: 'Failed to generate affirmations', 
        apiResponse: completion,
        tokenCount: tokenCount
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating affirmations:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

function validateAffirmation(affirmation: string): boolean {
  const gratitudePhrases = ['I am grateful for', 'I appreciate', 'I am thankful for'];
  const negativeWords = ['not', 'never', 'no longer', 'stop'];

  const startsWithGratitude = gratitudePhrases.some(phrase => affirmation.toLowerCase().startsWith(phrase.toLowerCase()));
  const containsNegativeWords = negativeWords.some(word => affirmation.toLowerCase().includes(word));
  const isInPresentTense = !affirmation.includes('will') && !affirmation.includes('going to');
  const hasValidLength = affirmation.length >= 20 && affirmation.length <= 200;

  if (!startsWithGratitude) console.log('Affirmation does not start with gratitude phrase:', affirmation);
  if (containsNegativeWords) console.log('Affirmation contains negative words:', affirmation);
  if (!isInPresentTense) console.log('Affirmation is not in present tense:', affirmation);
  if (!hasValidLength) console.log('Affirmation has invalid length:', affirmation);

  return startsWithGratitude && !containsNegativeWords && isInPresentTense && hasValidLength;
}
