import Link from 'next/link';
import TipsCarousel from '@/components/TipsCarousel';

const features = [
  {
    accent: 'indigo',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Slash API Costs',
    description:
      'Compresses verbose system prompts by 30–60% on average, directly reducing your Rakuten AI Gateway spend on every call.',
  },
  {
    accent: 'emerald',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Quality Confidence Score',
    description:
      'Every result ships with a confidence score. Hard constraints, safety rules, and domain facts are never removed — guaranteed.',
  },
  {
    accent: 'violet',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Document-Aware Crafting',
    description:
      "Upload any reference file and Promptly builds a structured system prompt from scratch — role, task, DOs and DON'Ts — tailored to your document.",
  },
  {
    accent: 'amber',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h6" />
      </svg>
    ),
    title: 'Visual Word-Level Diff',
    description:
      'See exactly what was removed and added in every optimization. Nothing is a black box — review before you ship.',
  },
  {
    accent: 'sky',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: 'Built-in AI Coach',
    description:
      'A floating AI assistant explains every change in plain language and teaches you prompt engineering techniques on the spot.',
  },
  {
    accent: 'rose',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: 'Craft → Optimize Pipeline',
    description:
      'Auto-optimize after crafting to run both steps back-to-back in one click — structured prompt, then compressed.',
  },
];

const accentClasses: Record<string, { border: string; icon: string }> = {
  indigo: { border: 'border-t-indigo-500', icon: 'bg-indigo-50 text-indigo-600' },
  emerald: { border: 'border-t-emerald-500', icon: 'bg-emerald-50 text-emerald-600' },
  violet: { border: 'border-t-violet-500', icon: 'bg-violet-50 text-violet-600' },
  amber: { border: 'border-t-amber-400', icon: 'bg-amber-50 text-amber-600' },
  sky: { border: 'border-t-sky-500', icon: 'bg-sky-50 text-sky-600' },
  rose: { border: 'border-t-rose-500', icon: 'bg-rose-50 text-rose-600' },
};

const steps = [
  {
    n: '01',
    title: 'Paste or upload',
    body: 'Drop your existing system prompt into the Optimize tab, or upload a reference document and write a rough intent in the Craft tab.',
  },
  {
    n: '02',
    title: 'Run the AI',
    body: 'Claude analyzes your prompt and returns a compressed or crafted version with a change log and confidence score — streamed live.',
  },
  {
    n: '03',
    title: 'Review and ship',
    body: 'Inspect the diff, read the explanation, tweak if needed, then copy the result straight into your API call.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* CSS animations */}
      <style>{`
        @keyframes float-card {
          0%, 100% { transform: rotateY(-20deg) rotateX(7deg) translateY(0px); }
          50%       { transform: rotateY(-20deg) rotateX(7deg) translateY(-14px); }
        }
        .mock-float {
          animation: float-card 6s ease-in-out infinite;
          transform: rotateY(-20deg) rotateX(7deg);
          filter: drop-shadow(0 32px 64px rgba(99,102,241,0.35));
        }
        @keyframes card-glow {
          0%, 100% { box-shadow: 0 0 60px rgba(99,102,241,0.2),  0 24px 48px rgba(0,0,0,0.5); }
          50%       { box-shadow: 0 0 100px rgba(99,102,241,0.35), 0 24px 48px rgba(0,0,0,0.5); }
        }
        .mock-glow { animation: card-glow 4s ease-in-out infinite; }
        @keyframes bar-rise {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
        .bar-before { transform-origin: bottom; animation: bar-rise 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .bar-after  { transform-origin: bottom; animation: bar-rise 0.9s cubic-bezier(0.34,1.56,0.64,1) 0.35s both; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stat-card { animation: fade-in-up 0.5s ease-out both; }
        .stat-card:nth-child(1) { animation-delay: 1s; }
        .stat-card:nth-child(2) { animation-delay: 1.2s; }
        .stat-card:nth-child(3) { animation-delay: 1.4s; }
      `}</style>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-7">
            <span className="font-extrabold text-gray-900 tracking-tight text-lg">Promptly</span>
            <div className="hidden md:flex items-center gap-5">
              <a href="#features"    className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Features</a>
              <a href="#efficiency"  className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Efficiency</a>
              <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">How it works</a>
              <a href="#tips"        className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Tips</a>
            </div>
          </div>
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Open App
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative bg-slate-900">
        {/* Background blobs — own overflow container so they don't bleed */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[700px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-700/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-indigo-500/8 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-0 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* ── Left col: text ── */}
          <div className="flex flex-col items-start gap-6 pb-16">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-indigo-200 text-xs font-semibold px-3 py-1 rounded-full tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Internal Tool · ESDD
            </span>

            <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight tracking-tight">
              Write smarter prompts.
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Pay less on every call.
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
              Promptly is an AI-powered prompt engineering workbench built for teams on the{' '}
              <span className="text-slate-300 font-medium">Rakuten AI Gateway</span>. Optimize, craft, and ship leaner,
              cheaper, more effective LLM system prompts.
            </p>

            <div className="flex items-center gap-3 flex-wrap pt-1">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-indigo-900/40 transition-all hover:scale-105 active:scale-100"
              >
                Get Started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="#efficiency"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-medium px-6 py-3 rounded-xl border border-white/20 transition-colors text-sm"
              >
                See efficiency gains
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>

            {/* Inline stats */}
            <div className="flex items-center gap-8 pt-2 border-t border-white/10 w-full">
              {[
                { value: '30–60%', label: 'avg token reduction' },
                { value: '0.95+',  label: 'quality confidence' },
                { value: 'Live',   label: 'streamed results' },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <span className="text-xl font-extrabold text-white tracking-tight">{s.value}</span>
                  <span className="text-xs text-slate-500 uppercase tracking-widest">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right col: 3D app mockup ── */}
          <div
            className="hidden lg:flex items-end justify-center pb-0 self-end"
            style={{ perspective: '1400px', perspectiveOrigin: '50% 100%' }}
          >
            <div className="mock-float">
              <div
                className="mock-glow rounded-xl overflow-hidden border border-white/10"
                style={{ width: 440 }}
              >
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="ml-2 text-[11px] text-slate-500 font-mono mx-auto">Promptly — Optimize</span>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-900 border-b border-white/10">
                  <div className="px-4 py-2 text-[11px] text-slate-500 cursor-default">Craft</div>
                  <div className="px-4 py-2 text-[11px] text-indigo-400 font-semibold border-b-2 border-indigo-500">Optimize</div>
                </div>

                {/* Two panels */}
                <div className="grid grid-cols-2 bg-slate-800">
                  {/* Before */}
                  <div className="p-4 border-r border-white/10">
                    <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest mb-3">Original Prompt</div>
                    <div className="flex flex-col gap-1.5">
                      {[92, 78, 85, 70, 88, 55, 73, 80].map((w, i) => (
                        <div key={i} className="h-1.5 bg-slate-600 rounded-full" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                    <div className="mt-3.5 flex items-center gap-1.5 bg-red-500/10 rounded-md px-2 py-1 w-fit border border-red-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <span className="text-[10px] text-red-400 font-mono font-bold">850 tokens</span>
                    </div>
                  </div>

                  {/* After */}
                  <div className="p-4 bg-indigo-950/30">
                    <div className="text-[9px] text-indigo-400 font-semibold uppercase tracking-widest mb-3">Optimized</div>
                    <div className="flex flex-col gap-1.5">
                      {[80, 64, 70, 0, 0, 0, 0, 0].map((w, i) =>
                        w > 0 ? (
                          <div key={i} className="h-1.5 bg-indigo-600/50 rounded-full" style={{ width: `${w}%` }} />
                        ) : (
                          <div key={i} className="h-1.5" />
                        )
                      )}
                    </div>
                    <div className="mt-3.5 flex items-center gap-1.5 bg-emerald-500/10 rounded-md px-2 py-1 w-fit border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">340 tokens</span>
                    </div>
                  </div>
                </div>

                {/* Confidence bar + action row */}
                <div className="px-4 py-3 bg-slate-900 flex items-center justify-between border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-default">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Optimize
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono cursor-default">+diff</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: '60%' }} />
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold">−60%</span>
                  </div>
                </div>

                {/* ROI strip */}
                <div className="px-4 py-2 bg-indigo-900/20 border-t border-indigo-500/20 flex items-center justify-between">
                  <span className="text-[9px] text-indigo-300 font-medium">ROI Intelligence</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-slate-500">510 tok saved</span>
                    <span className="text-[9px] text-emerald-400 font-bold">¥0.77/day</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3D Token Efficiency Section ── */}
      <section className="bg-slate-900 border-t border-white/8 py-20" id="efficiency">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">Token Efficiency</p>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Compression you can see
            </h2>
            <p className="text-slate-400 text-sm mt-3 max-w-xl mx-auto leading-relaxed">
              Every Promptly optimization shrinks your prompt&apos;s token footprint — fewer input tokens per call, compounded across
              thousands of API requests a day.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-12">

            {/* ── 3D Bar Chart ── */}
            <div
              className="flex-shrink-0"
              style={{ perspective: '700px', perspectiveOrigin: '50% 90%' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 56,
                  padding: '48px 64px 32px',
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  position: 'relative',
                }}
              >
                {/* Subtle grid lines on "floor" */}
                <div style={{ position: 'absolute', inset: '0 64px 32px', bottom: 32, height: 1, background: 'rgba(255,255,255,0.06)', top: 'auto' }} />

                {/* ── Before bar ── */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <div style={{ position: 'relative', width: 80 }}>
                    {/* Front face */}
                    <div
                      className="bar-before"
                      style={{
                        width: 80,
                        height: 200,
                        background: 'linear-gradient(180deg, #fca5a5 0%, #ef4444 45%, #dc2626 100%)',
                        borderRadius: '6px 6px 0 0',
                        position: 'relative',
                        zIndex: 2,
                      }}
                    />
                    {/* Right depth face */}
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      left: 80,
                      width: 18,
                      height: 200,
                      background: 'linear-gradient(180deg, #b91c1c, #7f1d1d)',
                      transformOrigin: 'top left',
                      transform: 'skewY(-45deg)',
                      zIndex: 1,
                    }} />
                    {/* Top face */}
                    <div style={{
                      position: 'absolute',
                      top: -10,
                      left: 9,
                      width: 80,
                      height: 12,
                      background: 'linear-gradient(135deg, #fecaca, #fca5a5)',
                      transformOrigin: 'bottom left',
                      transform: 'skewX(-45deg)',
                      zIndex: 3,
                    }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#f87171', lineHeight: 1 }}>850</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, letterSpacing: 1 }}>TOKENS BEFORE</div>
                  </div>
                </div>

                {/* Arrow + % badge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingBottom: 70, flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#a5b4fc', letterSpacing: 1 }}>−60%</span>
                  <svg width="52" height="14" fill="none" viewBox="0 0 52 14">
                    <path d="M0 7h46m0 0-5-5m5 5-5 5" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* ── After bar ── */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <div style={{ position: 'relative', width: 80 }}>
                    {/* Front face */}
                    <div
                      className="bar-after"
                      style={{
                        width: 80,
                        height: 84,
                        background: 'linear-gradient(180deg, #6ee7b7 0%, #10b981 45%, #059669 100%)',
                        borderRadius: '6px 6px 0 0',
                        position: 'relative',
                        zIndex: 2,
                      }}
                    />
                    {/* Right depth face */}
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      left: 80,
                      width: 18,
                      height: 84,
                      background: 'linear-gradient(180deg, #065f46, #064e3b)',
                      transformOrigin: 'top left',
                      transform: 'skewY(-45deg)',
                      zIndex: 1,
                    }} />
                    {/* Top face */}
                    <div style={{
                      position: 'absolute',
                      top: -10,
                      left: 9,
                      width: 80,
                      height: 12,
                      background: 'linear-gradient(135deg, #a7f3d0, #6ee7b7)',
                      transformOrigin: 'bottom left',
                      transform: 'skewX(-45deg)',
                      zIndex: 3,
                    }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#34d399', lineHeight: 1 }}>340</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, letterSpacing: 1 }}>TOKENS AFTER</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Stats panel ── */}
            <div className="flex flex-col gap-4 w-full lg:max-w-xs">
              {[
                {
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  ),
                  color: 'text-red-400',
                  bg: 'bg-red-500/10 border-red-500/20',
                  value: '510 tokens',
                  label: 'saved per API call',
                },
                {
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ),
                  color: 'text-indigo-400',
                  bg: 'bg-indigo-500/10 border-indigo-500/20',
                  value: '5.1M tokens/day',
                  label: 'not charged at 10k calls/day',
                },
                {
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-500/10 border-emerald-500/20',
                  value: '~¥1.4M / year',
                  label: 'projected savings (Claude Sonnet 4.6)',
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`stat-card flex items-start gap-3 rounded-xl border px-4 py-3.5 ${stat.bg}`}
                >
                  <div className={`mt-0.5 shrink-0 ${stat.color}`}>{stat.icon}</div>
                  <div>
                    <div className={`text-base font-extrabold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
                  </div>
                </div>
              ))}

              <p className="text-xs text-slate-600 leading-relaxed px-1">
                Numbers above use an example 850→340 token run at 10,000 calls/day with Claude Sonnet 4.6 pricing.
                Your actual savings are tracked live in the{' '}
                <Link href="/app" className="text-indigo-400 hover:underline">ROI dashboard</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-gray-50 py-20" id="features">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">Why Promptly</p>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Everything your prompt workflow needs
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const a = accentClasses[f.accent];
              return (
                <div
                  key={f.title}
                  className={`bg-white rounded-2xl border border-gray-100 border-t-4 ${a.border} p-6 flex flex-col gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${a.icon}`}>
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1.5">{f.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white py-20" id="how-it-works">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">The workflow</p>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">From rough idea to lean prompt</h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* connector line on md+ */}
            <div className="hidden md:block absolute top-7 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-200" />

            {steps.map((s) => (
              <div key={s.n} className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
                <div className="relative w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
                  <span className="text-white font-black text-lg">{s.n}</span>
                </div>
                <h3 className="font-bold text-gray-900">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-md transition-colors text-sm"
            >
              Try it now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Tips ── */}
      <section className="bg-gray-50 py-20 border-t border-gray-100" id="tips">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">Prompt Engineering</p>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              12 tips for better AI results
            </h2>
            <p className="text-gray-500 text-sm mt-3 max-w-xl mx-auto leading-relaxed">
              Evidence-based techniques distilled from{' '}
              <a
                href="https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline font-medium"
              >
                Anthropic
              </a>{' '}
              and{' '}
              <a
                href="https://platform.openai.com/docs/guides/prompt-engineering"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline font-medium"
              >
                OpenAI
              </a>{' '}
              official prompt engineering guidelines — applied to how you use Promptly and every LLM call you build.
            </p>
          </div>
          <TipsCarousel />
        </div>
      </section>

      {/* ── Developer / Built by ── */}
      <section className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center gap-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Built by</p>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-8 py-7 flex flex-col sm:flex-row items-center gap-6 w-full max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
              <span className="text-white font-extrabold text-xl tracking-tight select-none">SS</span>
            </div>
            <div className="flex flex-col gap-1.5 text-center sm:text-left">
              <p className="font-bold text-gray-900 text-base">Sadat Sayem</p>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">ESDD</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500 font-medium">Rakuten</span>
              </div>
              <a
                href="mailto:sadat.sayem@rakuten.com"
                className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors mt-0.5 inline-flex items-center gap-1.5 justify-center sm:justify-start"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                sadat.sayem@rakuten.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
            <span className="font-extrabold text-white text-sm tracking-tight">Promptly</span>
            <span className="hidden sm:block text-slate-600">|</span>
            <span className="text-slate-400 text-xs">
              &copy; {new Date().getFullYear()} Sadat Sayem &middot; ESDD, Rakuten. All rights reserved.
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-slate-500 text-xs">
            Built with
            <svg className="w-3.5 h-3.5 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            for the Rakuten AI Gateway team
          </span>
        </div>
      </footer>
    </div>
  );
}
