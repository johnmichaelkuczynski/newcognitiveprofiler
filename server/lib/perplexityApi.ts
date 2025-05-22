/**
 * Helper for making requests to the Perplexity API
 */
export async function apiRequest(
  prompt: string,
  model: string,
  apiKey: string
): Promise<{ text: string }> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a psychological profiler analyzing writing samples to generate insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Perplexity API error: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    return { text: data.choices[0]?.message?.content || '' };
  } catch (error) {
    console.error('Error in Perplexity API request:', error);
    throw error;
  }
}