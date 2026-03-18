import { NextRequest, NextResponse } from 'next/server';
import {
  createPromptVersion,
  getRegisteredPrompt,
  type PromptRegistryStatus,
  type PromptVersionSource,
} from '@/lib/promptRegistry';

function isValidStatus(status: string): status is PromptRegistryStatus {
  return status === 'draft' || status === 'approved' || status === 'deprecated';
}

function isValidSourceType(sourceType: string): sourceType is PromptVersionSource {
  return sourceType === 'original' || sourceType === 'optimized' || sourceType === 'crafted' || sourceType === 'manual';
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prompt = getRegisteredPrompt(id);
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
  }
  return NextResponse.json(prompt);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const {
    sourceType,
    content,
    notes,
    qualityConfidence,
    metadata,
    ownerName,
    ownerEmail,
    departmentName,
    status,
  } = body as {
    sourceType?: string;
    content?: string;
    notes?: string;
    qualityConfidence?: number;
    metadata?: Record<string, unknown>;
    ownerName?: string;
    ownerEmail?: string;
    departmentName?: string;
    status?: string;
  };

  if (!content?.trim() || !sourceType || !isValidSourceType(sourceType)) {
    return NextResponse.json({ error: 'content and a valid sourceType are required' }, { status: 400 });
  }

  if (status && !isValidStatus(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const safeStatus: PromptRegistryStatus | undefined =
    status && isValidStatus(status) ? status : undefined;

  const prompt = createPromptVersion({
    promptId: id,
    sourceType,
    content,
    notes,
    qualityConfidence,
    metadata,
    ownerName,
    ownerEmail,
    departmentName,
    status: safeStatus,
  });

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
  }

  return NextResponse.json(prompt, { status: 201 });
}
