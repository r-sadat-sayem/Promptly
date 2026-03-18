'use client';

import { useEffect, useState } from 'react';
import type { OptimizationResult } from '@/lib/optimizer';

type PromptRegistryStatus = 'draft' | 'approved' | 'deprecated';
type PromptVersionSource = 'original' | 'optimized' | 'crafted' | 'manual';

interface PromptRegistrySummary {
  id: string;
  ownerUserId: string | null;
  name: string;
  ownerName: string;
  ownerEmail: string | null;
  departmentName: string | null;
  status: PromptRegistryStatus;
  latestVersion: number;
  updatedAt: number;
  createdAt: number;
  latestContent: string;
  latestTokens: number;
  latestNotes: string | null;
  latestSourceType: PromptVersionSource;
  latestQualityConfidence: number | null;
}

interface PromptRegistryVersion {
  id: string;
  versionNumber: number;
  sourceType: PromptVersionSource;
  content: string;
  tokens: number;
  notes: string | null;
  qualityConfidence: number | null;
  createdAt: number;
}

interface PromptRegistryRecord {
  id: string;
  ownerUserId: string | null;
  name: string;
  ownerName: string;
  ownerEmail: string | null;
  departmentName: string | null;
  status: PromptRegistryStatus;
  latestVersion: number;
  createdAt: number;
  updatedAt: number;
  versions: PromptRegistryVersion[];
}

interface SaveFormState {
  mode: 'new' | 'version';
  promptId: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  departmentName: string;
  status: PromptRegistryStatus;
  sourceType: PromptVersionSource;
  notes: string;
}

interface PromptRegistryPanelProps {
  original: string;
  optimized: string;
  activeTab: 'craft' | 'optimize';
  result: OptimizationResult | null;
  onLoadPrompt: (content: string, target: 'original' | 'optimized') => void;
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusClasses(status: PromptRegistryStatus): string {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'deprecated') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

export default function PromptRegistryPanel({
  original,
  optimized,
  activeTab,
  result,
  onLoadPrompt,
}: PromptRegistryPanelProps) {
  const [prompts, setPrompts] = useState<PromptRegistrySummary[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptRegistryRecord | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<SaveFormState>({
    mode: 'new',
    promptId: '',
    name: '',
    ownerName: '',
    ownerEmail: '',
    departmentName: '',
    status: 'draft',
    sourceType: activeTab === 'craft' ? 'crafted' : 'optimized',
    notes: '',
  });

  useEffect(() => {
    setForm((current) => ({
      ...current,
      sourceType: activeTab === 'craft'
        ? (optimized.trim() ? 'crafted' : 'original')
        : (optimized.trim() ? 'optimized' : 'original'),
    }));
  }, [activeTab, optimized]);

  async function fetchRegistry() {
    setLoading(true);
    try {
      const res = await fetch('/api/registry');
      if (!res.ok) throw new Error('Failed to load prompt registry');
      const data = await res.json() as { prompts: PromptRegistrySummary[] };
      setPrompts(data.prompts);
      if (!selectedPromptId && data.prompts.length > 0) {
        setSelectedPromptId(data.prompts[0].id);
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Failed to load prompt registry');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRegistry();
  }, []);

  useEffect(() => {
    async function fetchDetail() {
      if (!selectedPromptId) {
        setSelectedPrompt(null);
        return;
      }

      setDetailLoading(true);
      try {
        const res = await fetch(`/api/registry/${selectedPromptId}`);
        if (!res.ok) throw new Error('Failed to load prompt details');
        const data = await res.json() as PromptRegistryRecord;
        setSelectedPrompt(data);
      } catch (err: unknown) {
        setMessage(err instanceof Error ? err.message : 'Failed to load prompt details');
      } finally {
        setDetailLoading(false);
      }
    }

    fetchDetail();
  }, [selectedPromptId]);

  function openModal(mode: 'new' | 'version') {
    setMessage(null);
    if (mode === 'version' && selectedPrompt) {
      setForm({
        mode,
        promptId: selectedPrompt.id,
        name: selectedPrompt.name,
        ownerName: selectedPrompt.ownerName,
        ownerEmail: selectedPrompt.ownerEmail ?? '',
        departmentName: selectedPrompt.departmentName ?? '',
        status: selectedPrompt.status,
        sourceType: activeTab === 'craft' ? 'crafted' : 'optimized',
        notes: '',
      });
    } else {
      setForm({
        mode,
        promptId: '',
        name: '',
        ownerName: '',
        ownerEmail: '',
        departmentName: '',
        status: 'draft',
        sourceType: activeTab === 'craft'
          ? (optimized.trim() ? 'crafted' : 'original')
          : (optimized.trim() ? 'optimized' : 'original'),
        notes: '',
      });
    }
    setShowModal(true);
  }

  function selectedContent(): string {
    if (form.sourceType === 'original') return original.trim();
    return optimized.trim() || original.trim();
  }

  function canSave(): boolean {
    const content = selectedContent();
    if (!content) return false;
    if (form.mode === 'new') {
      return (
        form.name.trim().length > 0 &&
        form.ownerName.trim().length > 0 &&
        form.ownerEmail.trim().length > 0
      );
    }
    return form.promptId.length > 0;
  }

  async function savePrompt() {
    if (!canSave()) return;

    setSaving(true);
    setMessage(null);
    const content = selectedContent();
    const qualityConfidence = result?.quality_confidence ?? null;
    const metadata = result
      ? {
          changes: result.changes,
          qualityNotes: result.quality_notes,
          sourceMetadata: result.metadata ?? null,
        }
      : null;

    try {
      const endpoint = form.mode === 'new' ? '/api/registry' : `/api/registry/${form.promptId}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          ownerName: form.ownerName,
          ownerEmail: form.ownerEmail,
          departmentName: form.departmentName,
          status: form.status,
          sourceType: form.sourceType,
          content,
          notes: form.notes,
          qualityConfidence,
          metadata,
        }),
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? 'Failed to save prompt');
      }

      const saved = await res.json() as PromptRegistryRecord;
      setSelectedPromptId(saved.id);
      setSelectedPrompt(saved);
      await fetchRegistry();
      setShowModal(false);
      setMessage(form.mode === 'new' ? 'Prompt saved to registry.' : 'New version added to registry.');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Failed to save prompt');
    } finally {
      setSaving(false);
    }
  }

  const hasSavableText = original.trim().length > 0 || optimized.trim().length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Prompt Registry</h2>
          <p className="text-xs text-gray-500">
            Save shared prompts with tracked owners, department, and version history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal('new')}
            disabled={!hasSavableText}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save as new
          </button>
          <button
            onClick={() => openModal('version')}
            disabled={!hasSavableText || !selectedPrompt}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add version
          </button>
        </div>
      </div>

      {message && (
        <div className="px-4 py-2 text-xs text-indigo-700 bg-indigo-50 border-b border-indigo-100">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="border-b lg:border-b-0 lg:border-r border-gray-100">
          <div className="px-4 py-3 text-xs uppercase tracking-widest text-gray-400 border-b border-gray-100">
            Registered prompts
          </div>
          <div className="max-h-[28rem] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-sm text-gray-500">Loading registry...</div>
            ) : prompts.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500">
                No saved prompts yet. Save your first optimized prompt to start a shared registry.
              </div>
            ) : (
              prompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => setSelectedPromptId(prompt.id)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                    selectedPromptId === prompt.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{prompt.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {prompt.ownerName}
                        {prompt.departmentName ? ` · ${prompt.departmentName}` : ''}
                      </p>
                    </div>
                    <span className={`shrink-0 text-[11px] font-medium border rounded-full px-2 py-0.5 ${statusClasses(prompt.status)}`}>
                      {prompt.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                    <span>v{prompt.latestVersion} · {prompt.latestSourceType}</span>
                    <span>{prompt.latestTokens} tok</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="min-h-[18rem]">
          {!selectedPromptId ? (
            <div className="px-4 py-6 text-sm text-gray-500">
              Select a saved prompt to inspect its owner and version history.
            </div>
          ) : detailLoading || !selectedPrompt ? (
            <div className="px-4 py-6 text-sm text-gray-500">Loading prompt details...</div>
          ) : (
            <div className="p-4 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedPrompt.name}</h3>
                  <p className="text-sm text-gray-500">
                    Owned by {selectedPrompt.ownerName}
                    {selectedPrompt.ownerEmail ? ` · ${selectedPrompt.ownerEmail}` : ''}
                    {selectedPrompt.departmentName ? ` · ${selectedPrompt.departmentName}` : ''}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <p>Updated {fmtDate(selectedPrompt.updatedAt)}</p>
                  <p>Created {fmtDate(selectedPrompt.createdAt)}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`font-medium border rounded-full px-2 py-1 ${statusClasses(selectedPrompt.status)}`}>
                  {selectedPrompt.status}
                </span>
                <span className="text-gray-400">Latest version: v{selectedPrompt.latestVersion}</span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_18rem] gap-4">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                      Latest content
                    </p>
                    <button
                      onClick={() => onLoadPrompt(selectedPrompt.versions[0].content, 'original')}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      Load into editor
                    </button>
                  </div>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed max-h-72 overflow-y-auto">
                    {selectedPrompt.versions[0].content}
                  </pre>
                </div>

                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-widest text-gray-500">
                    Version history
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {selectedPrompt.versions.map((version) => (
                      <div key={version.id} className="px-3 py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-800">v{version.versionNumber}</p>
                          <span className="text-[11px] text-gray-500 border border-gray-200 rounded-full px-2 py-0.5">
                            {version.sourceType}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {version.tokens} tok
                          {version.qualityConfidence !== null ? ` · qc ${version.qualityConfidence.toFixed(2)}` : ''}
                        </p>
                        {version.notes && (
                          <p className="mt-1 text-xs text-gray-600">{version.notes}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span className="text-[11px] text-gray-400">{fmtDate(version.createdAt)}</span>
                          <button
                            onClick={() => onLoadPrompt(version.content, 'original')}
                            className="text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            Load
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-gray-200 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {form.mode === 'new' ? 'Save Prompt to Registry' : 'Add Prompt Version'}
                </h3>
                <p className="text-sm text-gray-500">
                  {form.mode === 'new'
                    ? 'Create a reusable prompt record with an owner and initial version.'
                    : 'Append a new tracked version to the selected registered prompt.'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {form.mode === 'new' ? (
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Prompt name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Customer Support System Prompt"
                />
              </label>
            ) : (
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Registered prompt</span>
                <select
                  value={form.promptId}
                  onChange={(e) => {
                    const selected = prompts.find((prompt) => prompt.id === e.target.value);
                    setForm((current) => ({
                      ...current,
                      promptId: e.target.value,
                      name: selected?.name ?? current.name,
                      ownerName: selected?.ownerName ?? current.ownerName,
                      ownerEmail: selected?.ownerEmail ?? current.ownerEmail,
                      departmentName: selected?.departmentName ?? current.departmentName,
                      status: selected?.status ?? current.status,
                    }));
                  }}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {prompts.map((prompt) => (
                    <option key={prompt.id} value={prompt.id}>
                      {prompt.name} · v{prompt.latestVersion}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Owner</span>
                <input
                  value={form.ownerName}
                  onChange={(e) => setForm((current) => ({ ...current, ownerName: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Sadat Sayem"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Owner email</span>
                <input
                  value={form.ownerEmail}
                  onChange={(e) => setForm((current) => ({ ...current, ownerEmail: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="owner@company.com"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Department</span>
                <input
                  value={form.departmentName}
                  onChange={(e) => setForm((current) => ({ ...current, departmentName: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="CX, Analytics, Ops"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm((current) => ({ ...current, status: e.target.value as PromptRegistryStatus }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="deprecated">Deprecated</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Save source</span>
                <select
                  value={form.sourceType}
                  onChange={(e) => setForm((current) => ({ ...current, sourceType: e.target.value as PromptVersionSource }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="original">Original editor text</option>
                  <option value="optimized">Optimized result</option>
                  <option value="crafted">Crafted result</option>
                  <option value="manual">Manual editor content</option>
                </select>
              </label>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Preview</span>
                <div className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-700">
                  {selectedContent() ? `${selectedContent().slice(0, 80)}${selectedContent().length > 80 ? '...' : ''}` : 'Nothing to save yet'}
                </div>
              </div>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">Version notes</span>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Why this version exists, what changed, and where it should be used."
              />
            </label>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={savePrompt}
                disabled={saving || !canSave()}
                className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : form.mode === 'new' ? 'Save prompt' : 'Add version'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
