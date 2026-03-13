import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomUUID } from 'crypto';

interface SavingsConfig {
  daily_calls: number;
  price_per_million: number;
  model_name: string;
  currency: string;
  usd_to_jpy: number;
}

export function GET() {
  const config = db.prepare(
    'SELECT daily_calls, price_per_million, model_name, currency, usd_to_jpy FROM savings_config WHERE id = 1'
  ).get() as SavingsConfig;

  const totalRow = db.prepare(
    'SELECT COALESCE(SUM(tokens_saved), 0) as total, COUNT(*) as runs FROM savings_records'
  ).get() as { total: number; runs: number };

  const compressionRow = db.prepare(
    'SELECT AVG(CAST(tokens_saved AS REAL) / tokens_before * 100) as avg_pct FROM savings_records WHERE tokens_before > 0'
  ).get() as { avg_pct: number | null };

  const recentRows = db.prepare(
    'SELECT timestamp, type, tokens_before, tokens_after, tokens_saved FROM savings_records ORDER BY timestamp DESC LIMIT 5'
  ).all() as Array<{
    timestamp: number;
    type: string;
    tokens_before: number;
    tokens_after: number;
    tokens_saved: number;
  }>;

  // Past 7 days breakdown
  const now = Date.now();
  const dayMs = 86_400_000;
  const weeklyBreakdown = Array.from({ length: 7 }, (_, i) => {
    const dayStart = now - (6 - i) * dayMs;
    const dayEnd = dayStart + dayMs;
    const row = db.prepare(
      'SELECT COALESCE(SUM(tokens_saved), 0) as tokens FROM savings_records WHERE timestamp >= ? AND timestamp < ?'
    ).get(dayStart, dayEnd) as { tokens: number };

    const date = new Date(dayStart);
    const label = date.toLocaleDateString('en-US', { weekday: 'short' });
    return { label, tokens: row.tokens };
  });

  return NextResponse.json({
    totalTokensSaved: totalRow.total,
    totalRuns: totalRow.runs,
    avgCompressionPct: Math.round(compressionRow.avg_pct ?? 0),
    weeklyBreakdown,
    recentRuns: recentRows.map((r) => ({
      timestamp: r.timestamp,
      type: r.type,
      tokensBefore: r.tokens_before,
      tokensAfter: r.tokens_after,
      tokensSaved: r.tokens_saved,
    })),
    config: {
      dailyCalls: config.daily_calls,
      pricePerMillion: config.price_per_million,
      modelName: config.model_name ?? 'Custom',
      currency: config.currency ?? 'JPY',
      usdToJpy: config.usd_to_jpy ?? 155,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, tokensBefore, tokensAfter } = body as {
    type: string;
    tokensBefore: number;
    tokensAfter: number;
  };

  const tokensSaved = tokensBefore - tokensAfter;
  if (tokensSaved <= 0) {
    return NextResponse.json({ skipped: true });
  }

  const id = randomUUID();
  const timestamp = Date.now();

  db.prepare(
    'INSERT INTO savings_records (id, timestamp, type, tokens_before, tokens_after, tokens_saved) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, timestamp, type, tokensBefore, tokensAfter, tokensSaved);

  return NextResponse.json({ id, tokensSaved });
}
