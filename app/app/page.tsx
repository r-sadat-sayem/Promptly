'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import PromptEditor from '@/components/PromptEditor';
import TokenStats from '@/components/TokenStats';
import ExplanationPanel from '@/components/ExplanationPanel';
import DiffViewer from '@/components/DiffViewer';
import ChatBot from '@/components/ChatBot';
import FileUpload from '@/components/FileUpload';
import SavingsPanel from '@/components/SavingsPanel';
import type { SavingsPanelHandle } from '@/components/SavingsPanel';
import { countTokens } from '@/lib/tokenCounter';
import type { OptimizationResult } from '@/lib/optimizer';

type Tab = 'craft' | 'optimize';

export default function AppPage() {
  const [activeTab, setActiveTab] = useState<Tab>('craft');

  const [original, setOriginal] = useState('');
  const [optimized, setOptimized] = useState('');
  const [originalTokens, setOriginalTokens] = useState(0);
  const [optimizedTokens, setOptimizedTokens] = useState(0);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState('');

  // Craft-tab state
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [craftAsSystemPrompt, setCraftAsSystemPrompt] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [isAutoOptimizing, setIsAutoOptimizing] = useState(false);

  const savingsPanelRef = useRef<SavingsPanelHandle>(null);

  function recordSaving(type: string, before: number, after: number) {
    fetch('/api/savings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, tokensBefore: before, tokensAfter: after }),
    }).then(() => savingsPanelRef.current?.refresh()).catch(() => {});
  }

  useEffect(() => {
    setOriginalTokens(countTokens(original));
  }, [original]);

  useEffect(() => {
    setOptimizedTokens(countTokens(optimized));
  }, [optimized]);

  function switchTab(tab: Tab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setResult(null);
    setOptimized('');
    setError(null);
    setStreamBuffer('');
    setIsAutoOptimizing(false);
    if (tab === 'optimize') {
      setFileContent(null);
      setFileName(null);
    }
  }

  async function runSseStream(
    body: Record<string, unknown>,
    onChunk: (chunk: string) => void,
    onDone: (result: OptimizationResult) => void,
    onError: (msg: string) => void
  ) {
    const res = await fetch('/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Request failed');
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response stream');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = JSON.parse(line.slice(6));

        if (data.error) {
          onError(data.error);
          return null;
        }
        if (data.chunk) onChunk(data.chunk);
        if (data.done && data.result) {
          onDone(data.result);
          return data.result as OptimizationResult;
        }
      }
    }
    return null;
  }

  async function optimize() {
    if (!original.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setOptimized('');
    setStreamBuffer('');
    setIsAutoOptimizing(false);

    try {
      const body: Record<string, unknown> = { prompt: original };
      if (activeTab === 'craft' && fileContent) {
        body.fileContent = fileContent;
        body.fileName = fileName ?? 'uploaded-file';
        body.craftAsSystemPrompt = craftAsSystemPrompt;
      }

      let craftedText = '';
      const craftResult = await runSseStream(
        body,
        (chunk) => setStreamBuffer((prev) => prev + chunk),
        (r) => {
          setResult(r);
          setOptimized(r.optimized);
          craftedText = r.optimized;
        },
        (msg) => { throw new Error(msg); }
      );

      // Record savings for craft step (only when not auto-optimizing, otherwise
      // we'll record the final optimized result below)
      if (craftResult && !autoOptimize) {
        const craftedTokens = countTokens(craftedText);
        recordSaving(activeTab, originalTokens, craftedTokens);
      }

      // Auto-optimize: chain a second optimize call on the crafted result
      if (activeTab === 'craft' && autoOptimize && craftResult && craftedText) {
        setIsAutoOptimizing(true);
        setStreamBuffer('');

        let finalOptimized = '';
        await runSseStream(
          { prompt: craftedText },
          (chunk) => setStreamBuffer((prev) => prev + chunk),
          (r) => {
            setResult(r);
            setOptimized(r.optimized);
            finalOptimized = r.optimized;
          },
          (msg) => { throw new Error(msg); }
        );

        if (finalOptimized) {
          recordSaving('optimize', originalTokens, countTokens(finalOptimized));
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      setError(message);
    } finally {
      setLoading(false);
      setStreamBuffer('');
      setIsAutoOptimizing(false);
    }
  }

  async function pipelineOptimize() {
    if (!optimized.trim()) return;
    setLoading(true);
    setError(null);
    setIsAutoOptimizing(true);
    setStreamBuffer('');

    const textToOptimize = optimized;
    setOptimized('');

    try {
      let pipelineResult = '';
      await runSseStream(
        { prompt: textToOptimize },
        (chunk) => setStreamBuffer((prev) => prev + chunk),
        (r) => {
          setResult(r);
          setOptimized(r.optimized);
          pipelineResult = r.optimized;
        },
        (msg) => { throw new Error(msg); }
      );
      if (pipelineResult) {
        recordSaving('optimize', countTokens(textToOptimize), countTokens(pipelineResult));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Optimization failed';
      setError(message);
    } finally {
      setLoading(false);
      setStreamBuffer('');
      setIsAutoOptimizing(false);
    }
  }

  async function copyToClipboard() {
    if (!optimized) return;
    await navigator.clipboard.writeText(optimized);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function clearAll() {
    setOriginal('');
    setOptimized('');
    setResult(null);
    setError(null);
    setFileContent(null);
    setFileName(null);
    setStreamBuffer('');
    setIsAutoOptimizing(false);
  }

  const displayOptimized = loading && streamBuffer ? streamBuffer : optimized;

  const loadingLabel = isAutoOptimizing
    ? 'Optimizing crafted prompt...'
    : activeTab === 'craft'
    ? 'Crafting prompt...'
    : 'Optimizing...';

  const buttonLabel = activeTab === 'craft' ? 'Craft Prompt' : 'Optimize';

  const showPipelineButton =
    activeTab === 'craft' &&
    !loading &&
    result !== null &&
    optimized.trim().length > 0 &&
    !autoOptimize;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        {/* thin indigo accent line */}
        <div className="h-0.5 bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-600" />
        <div className="px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-extrabold text-gray-900 tracking-tight text-lg hover:text-indigo-600 transition-colors">
              Promptly
            </Link>
            <span className="hidden sm:block text-gray-300">|</span>
            <span className="hidden sm:block text-xs text-gray-400">Prompt Engineering Workbench</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
            {result && (
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 py-6 gap-4">

        {/* ROI Dashboard */}
        <SavingsPanel ref={savingsPanelRef} />

        {/* Tab switcher */}
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
          <button
            onClick={() => switchTab('craft')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'craft'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            Craft Prompt
          </button>
          <button
            onClick={() => switchTab('optimize')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'optimize'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            Optimize Prompt
          </button>
        </div>

        {/* Editor card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Craft tab: file upload + checkboxes */}
          {activeTab === 'craft' && (
            <div className="border-b border-gray-200">
              <FileUpload
                fileName={fileName}
                onFileLoad={(content, name) => {
                  setFileContent(content);
                  setFileName(name);
                }}
                onClear={() => {
                  setFileContent(null);
                  setFileName(null);
                }}
              />

              {/* Checkboxes */}
              <div className="flex items-center gap-6 px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoOptimize}
                    onChange={(e) => setAutoOptimize(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">Auto-optimize after crafting</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={craftAsSystemPrompt}
                    onChange={(e) => setCraftAsSystemPrompt(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">Format as system prompt</span>
                  <span className="relative group cursor-help">
                    <span className="inline-flex items-center justify-center w-4 h-4 text-xs text-gray-400 border border-gray-300 rounded-full leading-none">i</span>
                    <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                      A <strong>system prompt</strong> is a persistent instruction given to an AI before every conversation. It defines the AI&apos;s role, tone, and constraints — and has the strongest influence on model behavior. When checked, the output is explicitly structured for the <code className="bg-gray-700 px-1 rounded">system</code> turn of an LLM API call.
                      <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800" />
                    </span>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Editor panels */}
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200">
            <PromptEditor
              label={activeTab === 'craft' ? 'Your Rough Prompt' : 'Original Prompt'}
              value={original}
              onChange={setOriginal}
              placeholder={
                activeTab === 'craft'
                  ? 'Describe what you want the AI to do with the uploaded document...\n\nExample: "Summarize the key points for a sales team" or "Answer customer questions about this product"'
                  : 'Paste your system prompt or template here...\n\nExample: You are a helpful customer service agent. Please ensure that you always respond politely...'
              }
              tokenCount={originalTokens}
            />
            <PromptEditor
              label={activeTab === 'craft' ? 'Crafted Prompt' : 'Optimized Prompt'}
              value={displayOptimized}
              onChange={setOptimized}
              placeholder={
                loading
                  ? loadingLabel
                  : activeTab === 'craft'
                  ? 'The AI will craft a structured prompt with role, task, DOs and DON\'Ts tailored to your document.'
                  : 'Optimized prompt will appear here. You can edit it after optimization.'
              }
              tokenCount={optimizedTokens}
              highlight={!!result}
            />
          </div>

          <TokenStats
            beforeTokens={originalTokens}
            afterTokens={optimizedTokens}
            qualityConfidence={result?.quality_confidence ?? null}
            qualityNotes={result?.quality_notes ?? null}
            mode={activeTab === 'craft' ? 'craft' : 'optimize'}
          />
        </div>

        {/* Action row */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={optimize}
            disabled={loading || !original.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg shadow-sm transition-all hover:shadow-md active:scale-[0.98] text-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {loadingLabel}
              </>
            ) : (
              <>
                {buttonLabel}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

          {showPipelineButton && (
            <button
              onClick={pipelineOptimize}
              className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 py-2 hover:bg-indigo-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Optimize this prompt
            </button>
          )}

          {(original || fileContent) && (
            <button onClick={clearAll} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Clear all
            </button>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              {error}
            </p>
          )}
        </div>

        {/* Changes + Diff panels */}
        {result && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <ExplanationPanel changes={result.changes} qualityNotes={result.quality_notes} />
            {activeTab === 'optimize' && <DiffViewer original={original} optimized={optimized} />}
          </div>
        )}
      </main>

      <ChatBot />
    </div>
  );
}
