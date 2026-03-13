import { ai } from '@/lib/aiClient';

function extractTextContent(content: Array<{ type: string; text?: string }>): string {
  return content
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text ?? '')
    .join('');
}

export function parseJsonResponse<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (!match) {
      throw new Error('Failed to parse JSON response');
    }
    return JSON.parse(match[1]) as T;
  }
}

export async function runJsonCompletion<T>(params: {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
}): Promise<T> {
  const response = await ai.messages.create({
    model: params.model,
    max_tokens: params.maxTokens,
    temperature: 0,
    system: params.system,
    messages: [{ role: 'user', content: params.user }],
  });

  const text = extractTextContent(response.content as Array<{ type: string; text?: string }>);
  return parseJsonResponse<T>(text);
}
