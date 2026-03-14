import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { dailyCalls, pricePerMillion, modelName, currency, usdToJpy } = body as {
    dailyCalls?: number;
    pricePerMillion?: number;
    modelName?: string;
    currency?: string;
    usdToJpy?: number;
  };

  if (dailyCalls !== undefined) {
    db.prepare('UPDATE savings_config SET daily_calls = ? WHERE id = 1').run(dailyCalls);
  }
  if (pricePerMillion !== undefined) {
    db.prepare('UPDATE savings_config SET price_per_million = ? WHERE id = 1').run(pricePerMillion);
  }
  if (modelName !== undefined) {
    db.prepare('UPDATE savings_config SET model_name = ? WHERE id = 1').run(modelName);
  }
  if (currency !== undefined) {
    db.prepare('UPDATE savings_config SET currency = ? WHERE id = 1').run(currency);
  }
  if (usdToJpy !== undefined) {
    db.prepare('UPDATE savings_config SET usd_to_jpy = ? WHERE id = 1').run(usdToJpy);
  }

  const updated = db.prepare(
    'SELECT daily_calls, price_per_million, model_name, currency, usd_to_jpy FROM savings_config WHERE id = 1'
  ).get() as {
    daily_calls: number;
    price_per_million: number;
    model_name: string;
    currency: string;
    usd_to_jpy: number;
  };

  return NextResponse.json({
    dailyCalls: updated.daily_calls,
    pricePerMillion: updated.price_per_million,
    modelName: updated.model_name,
    currency: updated.currency,
    usdToJpy: updated.usd_to_jpy,
  });
}
