import { randomUUID } from 'crypto';
import db from '@/lib/db';
import { countTokens } from '@/lib/tokenCounter';
import { upsertUser } from '@/lib/users';

export type PromptRegistryStatus = 'draft' | 'approved' | 'deprecated';
export type PromptVersionSource = 'original' | 'optimized' | 'crafted' | 'manual';

export interface PromptRegistrySummary {
  id: string;
  ownerUserId: string | null;
  name: string;
  ownerName: string;
  ownerEmail: string | null;
  departmentName: string | null;
  status: PromptRegistryStatus;
  latestVersion: number;
  updatedAt: number;
  createdAt: number;
  latestContent: string;
  latestTokens: number;
  latestNotes: string | null;
  latestSourceType: PromptVersionSource;
  latestQualityConfidence: number | null;
}

export interface PromptRegistryVersion {
  id: string;
  versionNumber: number;
  sourceType: PromptVersionSource;
  content: string;
  tokens: number;
  notes: string | null;
  qualityConfidence: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: number;
}

export interface PromptRegistryRecord extends Omit<PromptRegistrySummary, 'latestContent' | 'latestTokens' | 'latestNotes' | 'latestSourceType' | 'latestQualityConfidence'> {
  versions: PromptRegistryVersion[];
}

export interface CreatePromptRegistryInput {
  name: string;
  ownerName: string;
  ownerEmail: string;
  departmentName?: string | null;
  status?: PromptRegistryStatus;
  sourceType: PromptVersionSource;
  content: string;
  notes?: string | null;
  qualityConfidence?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface CreatePromptVersionInput {
  promptId: string;
  sourceType: PromptVersionSource;
  content: string;
  notes?: string | null;
  qualityConfidence?: number | null;
  metadata?: Record<string, unknown> | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  departmentName?: string | null;
  status?: PromptRegistryStatus;
}

interface PromptRegistryRow {
  id: string;
  owner_user_id: string | null;
  name: string;
  owner_name: string;
  owner_email: string | null;
  department_name: string | null;
  status: PromptRegistryStatus;
  latest_version: number;
  created_at: number;
  updated_at: number;
  latest_content: string;
  latest_tokens: number;
  latest_notes: string | null;
  latest_source_type: PromptVersionSource;
  latest_quality_confidence: number | null;
}

interface PromptVersionRow {
  id: string;
  version_number: number;
  source_type: PromptVersionSource;
  content: string;
  tokens: number;
  notes: string | null;
  quality_confidence: number | null;
  metadata_json: string | null;
  created_at: number;
}

function normalizeOptionalText(text?: string | null): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapSummary(row: PromptRegistryRow): PromptRegistrySummary {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    ownerName: row.owner_name,
    ownerEmail: row.owner_email,
    departmentName: row.department_name,
    status: row.status,
    latestVersion: row.latest_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    latestContent: row.latest_content,
    latestTokens: row.latest_tokens,
    latestNotes: row.latest_notes,
    latestSourceType: row.latest_source_type,
    latestQualityConfidence: row.latest_quality_confidence,
  };
}

function mapVersion(row: PromptVersionRow): PromptRegistryVersion {
  return {
    id: row.id,
    versionNumber: row.version_number,
    sourceType: row.source_type,
    content: row.content,
    tokens: row.tokens,
    notes: row.notes,
    qualityConfidence: row.quality_confidence,
    metadata: row.metadata_json ? JSON.parse(row.metadata_json) as Record<string, unknown> : null,
    createdAt: row.created_at,
  };
}

export function listRegisteredPrompts(): PromptRegistrySummary[] {
  const rows = db.prepare(
    `SELECT
      p.id, p.name, p.owner_name, p.owner_email, p.team_name, p.status,
      p.owner_user_id,
      p.latest_version, p.created_at, p.updated_at,
      COALESCE(u.department_name, p.team_name) AS department_name,
      v.content AS latest_content,
      v.tokens AS latest_tokens,
      v.notes AS latest_notes,
      v.source_type AS latest_source_type,
      v.quality_confidence AS latest_quality_confidence
     FROM prompt_registry p
     LEFT JOIN users u
       ON u.id = p.owner_user_id
     JOIN prompt_versions v
       ON v.prompt_id = p.id
      AND v.version_number = p.latest_version
     ORDER BY p.updated_at DESC`
  ).all() as PromptRegistryRow[];

  return rows.map(mapSummary);
}

export function getRegisteredPrompt(promptId: string): PromptRegistryRecord | null {
  const summaryRows = db.prepare(
    `SELECT
      p.id, p.name, p.owner_name, p.owner_email, p.team_name, p.status,
      p.owner_user_id,
      p.latest_version, p.created_at, p.updated_at,
      COALESCE(u.department_name, p.team_name) AS department_name,
      v.content AS latest_content,
      v.tokens AS latest_tokens,
      v.notes AS latest_notes,
      v.source_type AS latest_source_type,
      v.quality_confidence AS latest_quality_confidence
     FROM prompt_registry p
     LEFT JOIN users u
       ON u.id = p.owner_user_id
     JOIN prompt_versions v
       ON v.prompt_id = p.id
      AND v.version_number = p.latest_version
     WHERE p.id = ?`
  ).get(promptId) as PromptRegistryRow | undefined;

  if (!summaryRows) return null;

  const versions = db.prepare(
    `SELECT id, version_number, source_type, content, tokens, notes, quality_confidence, metadata_json, created_at
     FROM prompt_versions
     WHERE prompt_id = ?
     ORDER BY version_number DESC`
  ).all(promptId) as PromptVersionRow[];

  const summary = mapSummary(summaryRows);
  return {
    id: summary.id,
    ownerUserId: summary.ownerUserId,
    name: summary.name,
    ownerName: summary.ownerName,
    ownerEmail: summary.ownerEmail,
    departmentName: summary.departmentName,
    status: summary.status,
    latestVersion: summary.latestVersion,
    createdAt: summary.createdAt,
    updatedAt: summary.updatedAt,
    versions: versions.map(mapVersion),
  };
}

export function createRegisteredPrompt(input: CreatePromptRegistryInput): PromptRegistryRecord {
  const now = Date.now();
  const promptId = randomUUID();
  const versionId = randomUUID();
  const content = input.content.trim();
  const tokens = countTokens(content);
  const owner = upsertUser({
    name: input.ownerName,
    email: input.ownerEmail,
    departmentName: input.departmentName,
  });

  const transaction = db.transaction(() => {
    db.prepare(
      `INSERT INTO prompt_registry (
        id, owner_user_id, name, owner_name, owner_email, team_name, status, latest_version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
    ).run(
      promptId,
      owner.id,
      input.name.trim(),
      owner.name,
      owner.email,
      normalizeOptionalText(owner.departmentName),
      input.status ?? 'draft',
      now,
      now
    );

    db.prepare(
      `INSERT INTO prompt_versions (
        id, prompt_id, version_number, source_type, content, tokens, notes,
        quality_confidence, metadata_json, created_at
      ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      versionId,
      promptId,
      input.sourceType,
      content,
      tokens,
      normalizeOptionalText(input.notes),
      input.qualityConfidence ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
      now
    );
  });

  transaction();
  return getRegisteredPrompt(promptId)!;
}

export function createPromptVersion(input: CreatePromptVersionInput): PromptRegistryRecord | null {
  const prompt = db.prepare(
    `SELECT id, latest_version FROM prompt_registry WHERE id = ?`
  ).get(input.promptId) as { id: string; latest_version: number } | undefined;

  if (!prompt) return null;

  const nextVersion = prompt.latest_version + 1;
  const now = Date.now();
  const content = input.content.trim();
  const tokens = countTokens(content);
  const owner =
    input.ownerName && input.ownerEmail
      ? upsertUser({
          name: input.ownerName,
          email: input.ownerEmail,
          departmentName: input.departmentName,
        })
      : null;

  const transaction = db.transaction(() => {
    db.prepare(
      `INSERT INTO prompt_versions (
        id, prompt_id, version_number, source_type, content, tokens, notes,
        quality_confidence, metadata_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      randomUUID(),
      input.promptId,
      nextVersion,
      input.sourceType,
      content,
      tokens,
      normalizeOptionalText(input.notes),
      input.qualityConfidence ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
      now
    );

    db.prepare(
      `UPDATE prompt_registry
       SET latest_version = ?, updated_at = ?, owner_user_id = COALESCE(?, owner_user_id),
           owner_name = COALESCE(?, owner_name),
           owner_email = COALESCE(?, owner_email), team_name = COALESCE(?, team_name),
           status = COALESCE(?, status)
       WHERE id = ?`
    ).run(
      nextVersion,
      now,
      owner?.id ?? null,
      normalizeOptionalText(owner?.name ?? input.ownerName),
      normalizeOptionalText(owner?.email ?? input.ownerEmail),
      normalizeOptionalText(owner?.departmentName ?? input.departmentName),
      input.status ?? null,
      input.promptId
    );
  });

  transaction();
  return getRegisteredPrompt(input.promptId);
}
