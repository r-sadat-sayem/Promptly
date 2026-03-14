import { NextRequest, NextResponse } from 'next/server';
import { runOptimizationPipeline } from '@/lib/optimizationPipeline';
import { logOptimizationEvent } from '@/lib/optimizationLogger';

export async function POST(req: NextRequest) {
  const { prompt, fileContent, fileName, craftAsSystemPrompt } = await req.json();

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const modelId = process.env.MODEL_ID || 'claude-sonnet-4-6';

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const { result } = await runOptimizationPipeline({
          prompt,
          fileContent: typeof fileContent === 'string' ? fileContent : null,
          fileName: typeof fileName === 'string' ? fileName : null,
          craftAsSystemPrompt: Boolean(craftAsSystemPrompt),
          modelId,
        });

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ chunk: result.optimized })}\n\n`)
        );

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, result })}\n\n`)
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Optimization failed';
        logOptimizationEvent('pipeline_error', { message }, 'error');
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
