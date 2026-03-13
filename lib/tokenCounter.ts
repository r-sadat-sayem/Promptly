import { getEncoding } from 'js-tiktoken';

let enc: ReturnType<typeof getEncoding> | null = null;
const cache = new Map<string, number>();

function getEncoder() {
  if (!enc) {
    enc = getEncoding('cl100k_base');
  }
  return enc;
}

export function countTokens(text: string): number {
  if (!text) return 0;
  if (cache.has(text)) return cache.get(text)!;

  const encoder = getEncoder();
  const tokens = encoder.encode(text).length;

  // Limit cache size to avoid memory bloat
  if (cache.size > 200) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(text, tokens);
  return tokens;
}

export function truncateToTokenLimit(text: string, limit: number): string {
  if (!text) return '';
  if (limit <= 0) return '';

  const encoder = getEncoder();
  const encoded = encoder.encode(text);
  if (encoded.length <= limit) return text;

  return encoder.decode(encoded.slice(0, limit));
}

export function formatSavings(before: number, after: number): string {
  if (before === 0) return '0%';
  const pct = ((before - after) / before) * 100;
  return `${pct >= 0 ? '-' : '+'}${Math.abs(pct).toFixed(1)}%`;
}
