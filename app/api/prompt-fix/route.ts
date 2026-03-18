import { NextRequest, NextResponse } from 'next/server';
import { PROMPT_REPAIR_SYSTEM_PROMPT, type PromptRepairResult } from '@/lib/optimizer';
import { runJsonCompletion } from '@/lib/llmJson';
import { sanitizeEvaluationInput } from '@/lib/promptUtils';
import { toSerializableError } from '@/lib/appErrors';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    prompt,
    mode,
    errorCode,
  } = body as {
    prompt?: string;
    mode?: 'craft' | 'optimize';
    errorCode?: string;
  };

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json({ error: { code: 'PROMPT_REQUIRED', userMessage: 'A prompt is required for AI Magic Fix.' } }, { status: 400 });
  }

  const modelId = process.env.MODEL_ID || 'claude-sonnet-4-6';

  try {
    const result = await runJsonCompletion<PromptRepairResult>({
      model: modelId,
      system: PROMPT_REPAIR_SYSTEM_PROMPT,
      user: [
        `Mode: ${mode ?? 'optimize'}`,
        errorCode ? `Recent error code: ${errorCode}` : null,
        `Prompt to repair:\n${sanitizeEvaluationInput(prompt)}`,
        'Clean this prompt so it is clearer, more stable, and safer to retry through the optimizer.',
      ].filter(Boolean).join('\n\n'),
      maxTokens: 1024,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ error: toSerializableError(error) }, { status: 500 });
  }
}
