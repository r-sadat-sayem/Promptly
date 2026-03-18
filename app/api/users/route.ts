import { NextRequest, NextResponse } from 'next/server';
import { listUsers, upsertUser } from '@/lib/users';

export function GET() {
  return NextResponse.json({ users: listUsers() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name,
    email,
    departmentName,
  } = body as {
    name?: string;
    email?: string;
    departmentName?: string;
  };

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
  }

  const user = upsertUser({ name, email, departmentName });
  return NextResponse.json(user, { status: 201 });
}
