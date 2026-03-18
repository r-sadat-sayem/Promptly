import { randomUUID } from 'crypto';
import db from '@/lib/db';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  departmentName: string | null;
  createdAt: number;
  updatedAt: number;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  department_name: string | null;
  created_at: number;
  updated_at: number;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeOptionalText(text?: string | null): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    departmentName: row.department_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listUsers(): UserRecord[] {
  const rows = db.prepare(
    `SELECT id, name, email, department_name, created_at, updated_at
     FROM users
     ORDER BY updated_at DESC, name ASC`
  ).all() as UserRow[];

  return rows.map(mapUser);
}

export function upsertUser(input: {
  name: string;
  email: string;
  departmentName?: string | null;
}): UserRecord {
  const now = Date.now();
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  const departmentName = normalizeOptionalText(input.departmentName);

  const existing = db.prepare(
    `SELECT id, name, email, department_name, created_at, updated_at
     FROM users
     WHERE email = ?`
  ).get(email) as UserRow | undefined;

  if (existing) {
    db.prepare(
      `UPDATE users
       SET name = ?, department_name = ?, updated_at = ?
       WHERE id = ?`
    ).run(name, departmentName, now, existing.id);

    return {
      id: existing.id,
      name,
      email,
      departmentName,
      createdAt: existing.created_at,
      updatedAt: now,
    };
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO users (id, name, email, department_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, name, email, departmentName, now, now);

  return {
    id,
    name,
    email,
    departmentName,
    createdAt: now,
    updatedAt: now,
  };
}
