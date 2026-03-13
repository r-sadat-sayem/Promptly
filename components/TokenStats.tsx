'use client';

interface TokenStatsProps {
  beforeTokens: number;
  afterTokens: number;
  qualityConfidence: number | null;
  qualityNotes: string | null;
  mode?: 'optimize' | 'craft';
}

export default function TokenStats({
  beforeTokens,
  afterTokens,
  qualityConfidence,
  qualityNotes,
  mode = 'optimize',
}: TokenStatsProps) {
  const savings = beforeTokens > 0 ? ((beforeTokens - afterTokens) / beforeTokens) * 100 : 0;
  const savingsPositive = savings > 0;

  const confidencePct = qualityConfidence !== null ? Math.round(qualityConfidence * 100) : null;
  const confidenceColor =
    confidencePct === null
      ? 'bg-gray-200'
      : confidencePct >= 90
      ? 'bg-emerald-500'
      : confidencePct >= 75
      ? 'bg-yellow-400'
      : 'bg-red-400';

  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-gray-50 border-t border-gray-200">
      {/* Token delta */}
      <div className="flex items-center gap-2 text-sm">
        {mode === 'craft' ? (
          <>
            <span className="text-gray-500">Input:</span>
            <span className="font-semibold text-gray-800">{beforeTokens.toLocaleString()} tokens</span>
            {afterTokens > 0 && (
              <>
                <span className="text-gray-400 mx-1">·</span>
                <span className="text-gray-500">Crafted prompt:</span>
                <span className="font-semibold text-gray-800">{afterTokens.toLocaleString()} tokens</span>
              </>
            )}
          </>
        ) : (
          <>
            <span className="text-gray-500">Tokens:</span>
            <span className="font-semibold text-gray-800">{beforeTokens.toLocaleString()}</span>
            {afterTokens > 0 && (
              <>
                <span className="text-gray-400">→</span>
                <span className="font-semibold text-gray-800">{afterTokens.toLocaleString()}</span>
                <span
                  className={`font-bold text-sm px-1.5 py-0.5 rounded ${
                    savingsPositive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {savingsPositive ? '-' : '+'}
                  {Math.abs(savings).toFixed(1)}%
                </span>
              </>
            )}
          </>
        )}
      </div>

      {/* Quality confidence bar */}
      {confidencePct !== null && (
        <div className="flex items-center gap-2 text-sm ml-auto">
          <span className="text-gray-500">Quality:</span>
          <div className="w-28 h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${confidenceColor}`}
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <span className="font-semibold text-gray-700 w-10">{confidencePct}%</span>
          {qualityNotes && (
            <span className="text-gray-500 text-xs max-w-xs truncate hidden lg:block" title={qualityNotes}>
              {qualityNotes}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
