import { ai } from '@/lib/aiClient';
import { AppError } from '@/lib/appErrors';
import { JSON_REPAIR_SYSTEM_PROMPT } from '@/lib/optimizer';
import { logOptimizationEvent } from '@/lib/optimizationLogger';

function extractTextContent(content: Array<{ type: string; text?: string }>): string {
  return content
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text ?? '')
    .join('');
}

export function parseJsonResponse<T>(text: string): T {
  if (!text || text.trim().length === 0) {
    throw new AppError({
      code: 'EMPTY_MODEL_RESPONSE',
      userMessage: 'Promptly could not read the AI response because it came back empty. Please retry.',
      technicalMessage: 'Model response content was empty.',
      canAutoFix: true,
      suggestedAction: 'Retry once, or use AI Magic Fix to rewrite the input prompt and retry.',
    });
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (!match) {
      throw new AppError({
        code: 'INVALID_MODEL_RESPONSE',
        userMessage: 'Promptly received a malformed AI response and could not finish the optimization. This usually means the response was cut off or formatted incorrectly.',
        technicalMessage: text.slice(0, 500),
        canAutoFix: true,
        suggestedAction: 'Retry once, or use AI Magic Fix to rewrite the prompt into a cleaner format before retrying.',
      });
    }
    try {
      return JSON.parse(match[1]) as T;
    } catch (error: unknown) {
      throw new AppError({
        code: 'INVALID_MODEL_RESPONSE',
        userMessage: 'Promptly received an AI response, but its JSON structure was incomplete or broken.',
        technicalMessage: error instanceof Error ? error.message : 'Unknown JSON parsing error',
        canAutoFix: true,
        suggestedAction: 'Retry once, or use AI Magic Fix to clean the prompt and retry.',
      });
    }
  }
}

export async function runJsonCompletion<T>(params: {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  allowRepair?: boolean;
}): Promise<T> {
  const response = await ai.messages.create({
    model: params.model,
    max_tokens: params.maxTokens,
    temperature: 0,
    system: params.system,
    messages: [{ role: 'user', content: params.user }],
  });

  const text = extractTextContent(response.content as Array<{ type: string; text?: string }>);
  try {
    return parseJsonResponse<T>(text);
  } catch (error: unknown) {
    const allowRepair = params.allowRepair ?? true;
    const isRepairable =
      error instanceof AppError &&
      (error.code === 'INVALID_MODEL_RESPONSE' || error.code === 'EMPTY_MODEL_RESPONSE');

    if (!allowRepair || !isRepairable) {
      throw error;
    }

    logOptimizationEvent('json_repair_attempt', {
      code: error.code,
      userMessage: error.userMessage,
    }, 'warn');

    const repairedText = await repairMalformedJson({
      model: params.model,
      originalSystemPrompt: params.system,
      malformedOutput: text,
    });

    try {
      const parsed = parseJsonResponse<T>(repairedText);
      logOptimizationEvent('json_repair_success', {
        repairedLength: repairedText.length,
      });
      return parsed;
    } catch (repairError: unknown) {
      logOptimizationEvent('json_repair_failed', {
        originalCode: error.code,
        repairError: repairError instanceof Error ? repairError.message : 'Unknown repair error',
      }, 'error');
      throw error;
    }
  }
}

async function repairMalformedJson(params: {
  model: string;
  originalSystemPrompt: string;
  malformedOutput: string;
}): Promise<string> {
  const response = await ai.messages.create({
    model: params.model,
    max_tokens: 2048,
    temperature: 0,
    system: JSON_REPAIR_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: [
        'Original system prompt:',
        params.originalSystemPrompt,
        '',
        'Malformed model output:',
        params.malformedOutput || '[empty response]',
      ].join('\n'),
    }],
  });

  return extractTextContent(response.content as Array<{ type: string; text?: string }>);
}
