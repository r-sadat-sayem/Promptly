'use client';

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

const MODEL_CATALOG: { name: string; usdPer1M: number | null }[] = [
  { name: 'Claude Opus 4',      usdPer1M: 15.00  },
  { name: 'Claude Sonnet 4.6',  usdPer1M: 3.00   },
  { name: 'Claude Haiku 4.5',   usdPer1M: 0.80   },
  { name: 'GPT-4o',             usdPer1M: 2.50   },
  { name: 'GPT-4o mini',        usdPer1M: 0.15   },
  { name: 'Gemini 1.5 Pro',     usdPer1M: 1.25   },
  { name: 'Gemini 1.5 Flash',   usdPer1M: 0.075  },
  { name: 'Gemini 2.0 Flash',   usdPer1M: 0.10   },
  { name: 'Custom',             usdPer1M: null   },
];

const TOOLTIPS = {
  tokens:          'Tokens are the chunks of text an AI model reads and writes — roughly ¾ of a word each. More tokens = higher cost per request.',
  inputTokens:     'Input tokens are the instructions you send to the AI (your system prompt). Optimizing these directly reduces cost on every single API call.',
  millionTokens:   'One million tokens ≈ about 750,000 words — roughly 1,500 pages of text.',
  dailyCalls:      "How many times per day your team's products call the AI using this prompt. A higher number amplifies the savings.",
  projectedYr:     'An estimate of how much you\'d save over a full year if this optimized prompt runs at your configured daily call volume.',
  compressionRate: 'How much shorter the optimized prompt is compared to the original, as a percentage. 40% means the AI now reads 40% fewer tokens on every call.',
  exchangeRate:    'Used to convert model preset prices (published in USD) to yen. Update if the exchange rate changes significantly.',
};

interface WeekDay { label: string; tokens: number; }

interface RecentRun {
  timestamp: number;
  type: string;
  tokensBefore: number;
  tokensAfter: number;
  tokensSaved: number;
}

interface SavingsData {
  totalTokensSaved: number;
  totalRuns: number;
  avgCompressionPct: number;
  weeklyBreakdown: WeekDay[];
  recentRuns: RecentRun[];
  config: {
    dailyCalls: number;
    pricePerMillion: number;
    modelName: string;
    currency: string;
    usdToJpy: number;
  };
}

export interface SavingsPanelHandle { refresh: () => void; }

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
}

function fmtNum(n: number): string { return n.toLocaleString(); }

function fmtCurrency(n: number, currency: string): string {
  if (currency === 'USD') {
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
    return '$' + n.toFixed(2);
  }
  if (n >= 1_000_000) return '¥' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '¥' + (n / 1_000).toFixed(1) + 'K';
  return '¥' + Math.round(n).toLocaleString();
}

function fmtRunTime(ts: number): string {
  const diff = Date.now() - ts;
  const day = 86_400_000;
  if (diff < day) return 'Today ' + new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (diff < 2 * day) return 'Yesterday';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center">
      <span className="cursor-help text-gray-400 hover:text-indigo-500 border border-gray-300 hover:border-indigo-300 rounded-full w-3.5 h-3.5 inline-flex items-center justify-center text-[9px] font-bold leading-none select-none transition-colors">
        ?
      </span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-gray-900 text-white text-xs rounded-lg p-2.5 leading-relaxed invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl whitespace-normal">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900" />
      </span>
    </span>
  );
}

const SavingsPanel = forwardRef<SavingsPanelHandle>((_, ref) => {
  const [data, setData] = useState<SavingsData | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [configDraft, setConfigDraft] = useState({
    dailyCalls: 10000,
    pricePerMillion: 1500,
    modelName: 'Custom',
    currency: 'JPY' as 'USD' | 'JPY',
    usdToJpy: 155,
  });
  const [copied, setCopied] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/savings');
      if (res.ok) setData(await res.json());
    } catch {
      // silently fail — dashboard is non-critical
    }
  }, []);

  useImperativeHandle(ref, () => ({ refresh: fetchData }), [fetchData]);
  useEffect(() => { fetchData(); }, [fetchData]);

  if (!data) return null;

  const { totalTokensSaved, totalRuns, avgCompressionPct, weeklyBreakdown, recentRuns, config } = data;

  const savedToDate = (totalTokensSaved / 1_000_000) * config.pricePerMillion;
  const avgSavedPerRun = totalTokensSaved / Math.max(totalRuns, 1);
  const projectedYr = (avgSavedPerRun * config.dailyCalls * 365 / 1_000_000) * config.pricePerMillion;
  const weekMax = Math.max(...weeklyBreakdown.map((d) => d.tokens), 1);
  const currencySymbol = config.currency === 'USD' ? '$' : '¥';

  function openConfig() {
    setConfigDraft({
      dailyCalls: config.dailyCalls,
      pricePerMillion: config.pricePerMillion,
      modelName: config.modelName,
      currency: config.currency as 'USD' | 'JPY',
      usdToJpy: config.usdToJpy,
    });
    setShowConfig(true);
  }

  function handleModelChange(name: string) {
    const entry = MODEL_CATALOG.find((m) => m.name === name);
    if (!entry || entry.usdPer1M === null) {
      setConfigDraft((d) => ({ ...d, modelName: name }));
      return;
    }
    const price = configDraft.currency === 'USD'
      ? entry.usdPer1M
      : Math.round(entry.usdPer1M * configDraft.usdToJpy);
    setConfigDraft((d) => ({ ...d, modelName: name, pricePerMillion: price }));
  }

  function handleCurrencyChange(currency: 'USD' | 'JPY') {
    const entry = MODEL_CATALOG.find((m) => m.name === configDraft.modelName);
    if (entry && entry.usdPer1M !== null) {
      const price = currency === 'USD'
        ? entry.usdPer1M
        : Math.round(entry.usdPer1M * configDraft.usdToJpy);
      setConfigDraft((d) => ({ ...d, currency, pricePerMillion: price }));
    } else {
      setConfigDraft((d) => ({ ...d, currency }));
    }
  }

  async function saveConfig() {
    setSavingConfig(true);
    try {
      const res = await fetch('/api/savings/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configDraft),
      });
      if (res.ok) {
        await fetchData();
        setShowConfig(false);
      }
    } finally {
      setSavingConfig(false);
    }
  }

  async function copyReport() {
    const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const text = `Promptly ROI Report — ${monthYear}
─────────────────────────────────────
Model:                   ${config.modelName}
Total tokens saved:      ${fmtNum(totalTokensSaved)}
Avg compression rate:    ${avgCompressionPct}%
Estimated cost saved:    ${fmtCurrency(savedToDate, config.currency)}
Projected annual saving: ${fmtCurrency(projectedYr, config.currency)}
  (at ${fmtNum(config.dailyCalls)} API calls/day · ${currencySymbol}${config.pricePerMillion}/1M tokens)
Optimizations run:       ${totalRuns}

Generated by Promptly · ESDD, Rakuten`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const headlines = (
    <div className="flex items-center gap-6">
      <div className="flex flex-col">
        <span className="text-lg font-extrabold text-gray-900 leading-tight">{fmt(totalTokensSaved)}</span>
        <span className="text-xs text-gray-400">tokens saved</span>
      </div>
      <div className="w-px h-8 bg-gray-200" />
      <div className="flex flex-col">
        <span className="text-lg font-extrabold text-emerald-600 leading-tight">{fmtCurrency(savedToDate, config.currency)}</span>
        <span className="text-xs text-gray-400">saved to date</span>
      </div>
      <div className="w-px h-8 bg-gray-200" />
      <div className="flex flex-col">
        <span className="text-lg font-extrabold text-indigo-600 leading-tight">{fmtCurrency(projectedYr, config.currency)}</span>
        <span className="text-xs text-gray-400">projected/yr</span>
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Header row — always visible */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-semibold text-gray-700">ROI Intelligence</span>
          </div>
          <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2 py-0.5 font-medium shrink-0">
            {config.modelName}
          </span>
          {!expanded && headlines}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openConfig}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Config
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50 transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 py-4 flex flex-col gap-4">
          {/* 3 stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-extrabold text-gray-900">{fmt(totalTokensSaved)}</span>
                <Tooltip text={TOOLTIPS.tokens} />
              </div>
              <span className="text-xs text-gray-500">tokens saved</span>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 flex flex-col gap-1">
              <span className="text-2xl font-extrabold text-emerald-700">{fmtCurrency(savedToDate, config.currency)}</span>
              <span className="text-xs text-emerald-600">saved to date</span>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3 flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-extrabold text-indigo-700">{fmtCurrency(projectedYr, config.currency)}</span>
                <Tooltip text={TOOLTIPS.projectedYr} />
              </div>
              <span className="text-xs text-indigo-600">projected/yr</span>
            </div>
          </div>

          {/* Compression rate */}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-500">Avg compression:</span>
            <span className="font-bold text-indigo-600">{avgCompressionPct}%</span>
            <Tooltip text={TOOLTIPS.compressionRate} />
          </div>

          {/* Weekly bar chart */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Past 7 days</p>
            <div className="flex items-end gap-1.5 h-16">
              {weeklyBreakdown.map((day) => {
                const pct = weekMax > 0 ? (day.tokens / weekMax) * 100 : 0;
                return (
                  <div key={day.label} className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-full relative" style={{ height: '48px' }}>
                      <div
                        className="absolute bottom-0 w-full rounded-t bg-indigo-400 transition-all"
                        style={{ height: `${Math.max(pct, day.tokens > 0 ? 4 : 0)}%` }}
                        title={`${fmt(day.tokens)} tokens`}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{day.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Based on {totalRuns} real optimization{totalRuns !== 1 ? 's' : ''} in Promptly · avg {avgCompressionPct}% compression · input token savings only
            </p>
          </div>

          {/* Recent Optimizations table */}
          {recentRuns.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Recent Optimizations</p>
              <div className="relative rounded-lg border border-gray-100 bg-white">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500">
                      <th className="text-left px-3 py-2 font-medium">Time</th>
                      <th className="text-right px-3 py-2 font-medium">Before</th>
                      <th className="text-right px-3 py-2 font-medium">After</th>
                      <th className="text-right px-3 py-2 font-medium">Saved</th>
                      <th className="text-right px-3 py-2 font-medium">
                        <span className="flex items-center justify-end gap-1">
                          Cost/day¹
                          <Tooltip text={`Tokens saved per call × ${fmtNum(config.dailyCalls)} calls/day = fewer tokens charged each day.`} />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRuns.map((run, i) => {
                      const costPerDay = (run.tokensSaved / 1_000_000) * config.pricePerMillion * config.dailyCalls;
                      return (
                        <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-500">{fmtRunTime(run.timestamp)}</td>
                          <td className="px-3 py-2 text-right text-gray-600">{fmtNum(run.tokensBefore)}</td>
                          <td className="px-3 py-2 text-right text-gray-600">{fmtNum(run.tokensAfter)}</td>
                          <td className="px-3 py-2 text-right font-medium text-emerald-600">{fmtNum(run.tokensSaved)}</td>
                          <td className="px-3 py-2 text-right font-medium text-indigo-600">{fmtCurrency(costPerDay, config.currency)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="text-xs text-gray-400 px-3 py-1.5 bg-gray-50 border-t border-gray-100">
                  ¹ at {fmtNum(config.dailyCalls)} calls/day
                </p>
              </div>
            </div>
          )}

          {/* Footer: config summary + copy */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {fmtNum(config.dailyCalls)} calls/day · {currencySymbol}{config.pricePerMillion}/1M · {totalRuns} runs
            </span>
            <button
              onClick={copyReport}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Report
                </>
              )}
            </button>
          </div>

          {/* Mission framing */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-600 mb-1.5">Why Promptly exists</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every token sent to an AI model costs money — and most system prompts are 30–60% longer than they need to be.
              Promptly was built to close that gap: make AI usage leaner, more intentional, and cheaper for the whole ESDD team — without sacrificing quality or safety.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              The numbers above are real. Every saving shown here came from an actual prompt optimized in this tool.
            </p>
          </div>
        </div>
      )}

      {/* Config modal */}
      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm mx-4 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">Model & Pricing</h3>
              <button onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Model preset */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Model preset</span>
                <select
                  value={configDraft.modelName}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {MODEL_CATALOG.map((m) => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </label>

              {/* Input price */}
              <label className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
                  Input price (per 1M tokens)
                  <Tooltip text={TOOLTIPS.inputTokens} />
                  <Tooltip text={TOOLTIPS.millionTokens} />
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 w-4 text-center">{configDraft.currency === 'USD' ? '$' : '¥'}</span>
                  <input
                    type="number"
                    min={0}
                    step={configDraft.currency === 'USD' ? 0.001 : 1}
                    value={configDraft.pricePerMillion}
                    onChange={(e) => setConfigDraft((d) => ({ ...d, pricePerMillion: Number(e.target.value), modelName: 'Custom' }))}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-gray-400">/1M</span>
                </div>
              </label>

              {/* Currency toggle */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Display currency</span>
                <div className="flex gap-2">
                  {(['USD', 'JPY'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleCurrencyChange(c)}
                      className={`flex-1 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                        configDraft.currency === c
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exchange rate — JPY mode only */}
              {configDraft.currency === 'JPY' && (
                <label className="flex flex-col gap-1">
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
                    Exchange rate (¥/$)
                    <Tooltip text={TOOLTIPS.exchangeRate} />
                  </span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={configDraft.usdToJpy}
                    onChange={(e) => setConfigDraft((d) => ({ ...d, usdToJpy: Number(e.target.value) }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </label>
              )}

              {/* Daily API calls */}
              <label className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
                  Daily API calls
                  <Tooltip text={TOOLTIPS.dailyCalls} />
                </span>
                <input
                  type="number"
                  min={1}
                  value={configDraft.dailyCalls}
                  onChange={(e) => setConfigDraft((d) => ({ ...d, dailyCalls: Number(e.target.value) }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setShowConfig(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveConfig}
                disabled={savingConfig}
                className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {savingConfig ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

SavingsPanel.displayName = 'SavingsPanel';
export default SavingsPanel;
