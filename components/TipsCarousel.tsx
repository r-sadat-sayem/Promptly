'use client';

import { useState, useEffect, useCallback } from 'react';

interface TipRef {
  label: string;
  section: string;
  url: string;
}

interface Tip {
  n: number;
  category: string;
  iconPath: string;
  title: string;
  body: string;
  impact: string;
  refs: TipRef[];
}

const ANTHROPIC_URL = 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview';
const OPENAI_URL = 'https://platform.openai.com/docs/guides/prompt-engineering';

const TIPS: Tip[] = [
  {
    n: 1,
    category: 'Clarity',
    iconPath: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122',
    title: 'Be Specific — Concrete Verbs Win',
    body: 'Replace vague requests with precise action verbs. "Summarize in 3 bullet points focusing on cost and timeline" outperforms "give me a summary." The model cannot read intent — it reads words. Every ambiguous word is a branch point that may go wrong.',
    impact: 'Reduces back-and-forth iteration cycles by ~60%. More specific = fewer follow-up messages = lower total token cost.',
    refs: [
      { label: 'Anthropic', section: 'Be clear and direct', url: ANTHROPIC_URL },
      { label: 'OpenAI', section: 'Write clear instructions', url: OPENAI_URL },
    ],
  },
  {
    n: 2,
    category: 'Efficiency',
    iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
    title: 'Use Imperative Voice',
    body: 'Write "Respond in JSON" not "Could you please respond in JSON format if possible?" AI models don\'t require politeness — they require precision. Imperative voice eliminates conditional language that models sometimes interpret as optional.',
    impact: 'Saves 5–20 tokens per instruction on average. In a 400-token prompt with 10 instructions, this is a 5–12% reduction — free savings.',
    refs: [
      { label: 'Anthropic', section: 'Use direct language', url: ANTHROPIC_URL },
      { label: 'OpenAI', section: 'Write clear instructions', url: OPENAI_URL },
    ],
  },
  {
    n: 3,
    category: 'Structure',
    iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    title: 'Assign a Role or Persona',
    body: '"You are a senior security engineer reviewing code for vulnerabilities" outperforms "review this code." A defined role anchors the model\'s knowledge domain, tone, and decision criteria — reducing out-of-scope tangents and grounding responses in the relevant discipline.',
    impact: 'Measurably improves domain accuracy on specialized tasks and reduces hallucination on technical subjects.',
    refs: [
      { label: 'Anthropic', section: 'Give Claude a role', url: ANTHROPIC_URL },
      { label: 'OpenAI', section: 'Tactics — ask the model to adopt a persona', url: OPENAI_URL },
    ],
  },
  {
    n: 4,
    category: 'Structure',
    iconPath: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
    title: 'Use XML Tags to Structure Prompts (Claude)',
    body: 'Claude performs significantly better when distinct sections are wrapped in XML: <instructions>, <context>, <examples>, <output_format>. Tags separate concerns semantically — the model knows exactly what role each section plays and doesn\'t let one bleed into another.',
    impact: 'Critical for prompts longer than 300 tokens. Prevents instruction bleed, a common cause of partial rule-following on complex multi-part prompts.',
    refs: [
      { label: 'Anthropic', section: 'Use XML tags to structure prompts', url: ANTHROPIC_URL },
    ],
  },
  {
    n: 5,
    category: 'Learning',
    iconPath: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    title: 'Use Examples — Few-Shot Prompting',
    body: 'One well-chosen example is worth 50 words of instruction. Showing the model the exact input/output format you expect — even a single example — dramatically improves consistency. The model infers your unstated requirements from the example\'s structure and tone.',
    impact: 'Reduces output format errors by ~70% compared to instruction-only prompts. Eliminates the most common source of unparseable API responses.',
    refs: [
      { label: 'Anthropic', section: 'Use examples (multishot prompting)', url: ANTHROPIC_URL },
      { label: 'OpenAI', section: 'Provide examples', url: OPENAI_URL },
    ],
  },
  {
    n: 6,
    category: 'Architecture',
    iconPath: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
    title: 'Separate Instructions from Context',
    body: 'Behavior rules belong in the system prompt. User data, documents, and input content belong in the user message. Mixing them forces the model to infer which parts are rules and which are data — a common source of misapplied constraints and format errors.',
    impact: 'Improves prompt reusability across different inputs and reduces constraint violations caused by instruction-context overlap.',
    refs: [
      { label: 'Anthropic', section: 'System prompts vs. user turns', url: ANTHROPIC_URL },
      { label: 'OpenAI', section: 'Split complex tasks into simpler subtasks', url: OPENAI_URL },
    ],
  },
  {
    n: 7,
    category: 'Reasoning',
    iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    title: 'Chain of Thought for Complex Tasks',
    body: 'For multi-step reasoning, instruct the model to think before answering: "Reason step by step, then give your final answer." This forces intermediate reasoning that dramatically improves accuracy on analysis, math, and decision-making tasks where the first intuition is often wrong.',
    impact: 'Accuracy on complex reasoning benchmarks improves 20–40% with chain-of-thought prompting vs. direct-answer prompts.',
    refs: [
      { label: 'Anthropic', section: 'Chain of thought prompting', url: ANTHROPIC_URL },
      { label: 'OpenAI', section: 'Give the model time to think', url: OPENAI_URL },
    ],
  },
  {
    n: 8,
    category: 'Format',
    iconPath: 'M4 6h16M4 10h16M4 14h10M4 18h6',
    title: 'Specify Output Format Explicitly',
    body: 'Never assume the model will pick the right format. If you need JSON, say "Return valid JSON only." If you need markdown headers, say so. If you need plain text, say "No markdown." Unspecified format is the most common cause of AI pipeline parse failures in production.',
    impact: 'Eliminates format-related parsing failures — the #1 cause of downstream crashes in AI-powered pipelines and APIs.',
    refs: [
      { label: 'Anthropic', section: 'Specify desired output format', url: ANTHROPIC_URL },
      { label: 'OpenAI', section: 'Specify the steps required', url: OPENAI_URL },
    ],
  },
  {
    n: 9,
    category: 'Precision',
    iconPath: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
    title: 'Use Positive Instructions Over Negations',
    body: '"Respond only in English" is more reliable than "Don\'t respond in other languages." Negative constraints require the model to reason about what not to do — a cognitively harder task. Positive instructions define a clear target; negations define a fuzzy boundary.',
    impact: 'Reduces constraint violations by ~30% in controlled evaluations. Especially important for safety guardrails and output restrictions.',
    refs: [
      { label: 'Anthropic', section: 'Be clear and direct', url: ANTHROPIC_URL },
      { label: 'OpenAI', section: 'Write clear instructions', url: OPENAI_URL },
    ],
  },
  {
    n: 10,
    category: 'Security',
    iconPath: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    title: 'Use Delimiters to Separate Content',
    body: 'Use triple backticks, XML tags, or angle brackets to clearly separate instructions from user input: `Text to analyze: \`\`\`{input}\`\`\``. Without delimiters, user input can be interpreted as instructions — a classic prompt injection vector that bypasses system rules.',
    impact: 'Critical for security. Prevents prompt injection attacks where user-provided content overrides or bypasses your system instructions.',
    refs: [
      { label: 'OpenAI', section: 'Use delimiters to indicate distinct parts', url: OPENAI_URL },
      { label: 'Anthropic', section: 'Use XML tags to structure prompts', url: ANTHROPIC_URL },
    ],
  },
  {
    n: 11,
    category: 'Efficiency',
    iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    title: 'Keep Context Minimal and Relevant',
    body: 'Only include context the model actually needs to complete the task. Irrelevant background dilutes the signal — it can cause the model to reference or be influenced by information that should be ignored, and every unnecessary token increases cost with no benefit.',
    impact: 'Every unnecessary context token costs money and reduces model focus. Lean context is a compounding advantage at scale.',
    refs: [
      { label: 'Anthropic', section: 'Be concise and precise', url: ANTHROPIC_URL },
      { label: 'OpenAI', section: 'Provide reference text', url: OPENAI_URL },
    ],
  },
  {
    n: 12,
    category: 'Process',
    iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    title: 'Test One Variable at a Time',
    body: 'When improving a prompt, change one element at a time and compare results systematically. Changing multiple things at once makes it impossible to know what caused the improvement — or the regression. Treat prompt engineering like A/B testing: isolate, measure, iterate.',
    impact: 'The only reliable method for sustained prompt quality improvement. Intuition-based editing plateaus; systematic iteration compounds.',
    refs: [
      { label: 'OpenAI', section: 'Test changes systematically', url: OPENAI_URL },
      { label: 'Anthropic', section: 'Iterating on your prompt', url: ANTHROPIC_URL },
    ],
  },
];

const CATEGORY_STYLES: Record<string, {
  badge: string;
  iconBg: string;
  iconColor: string;
  impactBg: string;
  impactText: string;
  dot: string;
}> = {
  Clarity:      { badge: 'bg-indigo-50 text-indigo-700',  iconBg: 'bg-indigo-50',  iconColor: 'text-indigo-600',  impactBg: 'bg-indigo-50/60',  impactText: 'text-indigo-700',  dot: 'bg-indigo-500' },
  Efficiency:   { badge: 'bg-emerald-50 text-emerald-700', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', impactBg: 'bg-emerald-50/60', impactText: 'text-emerald-700', dot: 'bg-emerald-500' },
  Structure:    { badge: 'bg-violet-50 text-violet-700',   iconBg: 'bg-violet-50',  iconColor: 'text-violet-600',  impactBg: 'bg-violet-50/60',  impactText: 'text-violet-700',  dot: 'bg-violet-500' },
  Learning:     { badge: 'bg-sky-50 text-sky-700',         iconBg: 'bg-sky-50',     iconColor: 'text-sky-600',     impactBg: 'bg-sky-50/60',     impactText: 'text-sky-700',     dot: 'bg-sky-500' },
  Architecture: { badge: 'bg-teal-50 text-teal-700',       iconBg: 'bg-teal-50',    iconColor: 'text-teal-600',    impactBg: 'bg-teal-50/60',    impactText: 'text-teal-700',    dot: 'bg-teal-500' },
  Reasoning:    { badge: 'bg-amber-50 text-amber-700',     iconBg: 'bg-amber-50',   iconColor: 'text-amber-600',   impactBg: 'bg-amber-50/60',   impactText: 'text-amber-700',   dot: 'bg-amber-500' },
  Format:       { badge: 'bg-rose-50 text-rose-700',       iconBg: 'bg-rose-50',    iconColor: 'text-rose-600',    impactBg: 'bg-rose-50/60',    impactText: 'text-rose-700',    dot: 'bg-rose-500' },
  Precision:    { badge: 'bg-lime-50 text-lime-700',       iconBg: 'bg-lime-50',    iconColor: 'text-lime-600',    impactBg: 'bg-lime-50/60',    impactText: 'text-lime-700',    dot: 'bg-lime-500' },
  Security:     { badge: 'bg-orange-50 text-orange-700',   iconBg: 'bg-orange-50',  iconColor: 'text-orange-600',  impactBg: 'bg-orange-50/60',  impactText: 'text-orange-700',  dot: 'bg-orange-500' },
  Process:      { badge: 'bg-gray-100 text-gray-700',      iconBg: 'bg-gray-100',   iconColor: 'text-gray-600',    impactBg: 'bg-gray-50',       impactText: 'text-gray-700',    dot: 'bg-gray-500' },
};

export default function TipsCarousel() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [paused, setPaused] = useState(false);

  const navigate = useCallback((to: number) => {
    setFading(true);
    setTimeout(() => {
      setCurrent(((to % TIPS.length) + TIPS.length) % TIPS.length);
      setFading(false);
    }, 180);
  }, []);

  // Auto-advance every 6.5 s, reset timer on any navigation
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => navigate(current + 1), 6500);
    return () => clearTimeout(t);
  }, [current, paused, navigate]);

  const tip = TIPS[current];
  const c = CATEGORY_STYLES[tip.category] ?? CATEGORY_STYLES.Clarity;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Card ── */}
      <div
        className={`bg-white rounded-2xl border border-gray-200 shadow-sm transition-opacity duration-[180ms] ${
          fading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Progress bar */}
        <div className="h-0.5 bg-gray-100 rounded-t-2xl overflow-hidden">
          <div
            className={`h-full ${c.dot} transition-none`}
            style={{ width: `${((current + 1) / TIPS.length) * 100}%`, transition: fading ? 'none' : 'width 0.3s ease' }}
          />
        </div>

        <div className="p-7 sm:p-9">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <span className={`text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${c.badge}`}>
              {tip.category}
            </span>
            <span className="text-xs text-gray-400 tabular-nums">
              {tip.n} <span className="text-gray-300">/</span> {TIPS.length}
            </span>
          </div>

          {/* Icon + Title */}
          <div className="flex items-start gap-4 mb-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.iconBg}`}>
              <svg className={`w-5 h-5 ${c.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tip.iconPath} />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 leading-snug pt-1">{tip.title}</h3>
          </div>

          {/* Body */}
          <p className="text-gray-600 text-sm leading-relaxed mb-5">{tip.body}</p>

          {/* Impact */}
          <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 mb-6 ${c.impactBg} border border-opacity-30`}
            style={{ borderColor: 'currentColor', borderWidth: 0 }}
          >
            <svg className={`w-4 h-4 mt-0.5 shrink-0 ${c.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className={`text-xs font-semibold leading-relaxed ${c.impactText}`}>{tip.impact}</span>
          </div>

          {/* References */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-gray-400 font-medium shrink-0">Sources:</span>
            {tip.refs.map((ref) => (
              <a
                key={ref.label}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full border border-indigo-100 transition-colors"
              >
                {ref.label} — {ref.section}
                <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-center gap-3 mt-5">
        {/* Prev */}
        <button
          onClick={() => navigate(current - 1)}
          aria-label="Previous tip"
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 hover:shadow-sm bg-white transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {TIPS.map((t, i) => (
            <button
              key={i}
              onClick={() => navigate(i)}
              aria-label={`Go to tip ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? `w-5 h-2 ${c.dot}`
                  : 'w-2 h-2 bg-gray-200 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Next */}
        <button
          onClick={() => navigate(current + 1)}
          aria-label="Next tip"
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 hover:shadow-sm bg-white transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Auto-advance hint */}
      <p className="text-center text-[11px] text-gray-400 mt-2.5">
        {paused ? 'Paused' : 'Auto-advances every 6s'} · hover to pause · click dots to jump
      </p>
    </div>
  );
}
