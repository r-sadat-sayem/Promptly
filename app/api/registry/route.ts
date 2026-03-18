import { NextRequest, NextResponse } from 'next/server';
import {
  createRegisteredPrompt,
  listRegisteredPrompts,
  type PromptRegistryStatus,
  type PromptVersionSource,
} from '@/lib/promptRegistry';

function isValidStatus(status: string): status is PromptRegistryStatus {
  return status === 'draft' || status === 'approved' || status === 'deprecated';
}

function isValidSourceType(sourceType: string): sourceType is PromptVersionSource {
  return sourceType === 'original' || sourceType === 'optimized' || sourceType === 'crafted' || sourceType === 'manual';
}

export function GET() {
  return NextResponse.json({ prompts: listRegisteredPrompts() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name,
    ownerName,
    ownerEmail,
    departmentName,
    status,
    sourceType,
    content,
    notes,
    qualityConfidence,
    metadata,
  } = body as {
    name?: string;
    ownerName?: string;
    ownerEmail?: string;
    departmentName?: string;
    status?: string;
    sourceType?: string;
    content?: string;
    notes?: string;
    qualityConfidence?: number;
    metadata?: Record<string, unknown>;
  };

  if (!name?.trim() || !ownerName?.trim() || !ownerEmail?.trim() || !content?.trim() || !sourceType || !isValidSourceType(sourceType)) {
    return NextResponse.json({ error: 'name, ownerName, ownerEmail, content, and a valid sourceType are required' }, { status: 400 });
  }

  if (status && !isValidStatus(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const safeStatus: PromptRegistryStatus | undefined =
    status && isValidStatus(status) ? status : undefined;

  const prompt = createRegisteredPrompt({
    name,
    ownerName,
    ownerEmail,
    departmentName,
    status: safeStatus,
    sourceType,
    content,
    notes,
    qualityConfidence,
    metadata,
  });

  return NextResponse.json(prompt, { status: 201 });
}
