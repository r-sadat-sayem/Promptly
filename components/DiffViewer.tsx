'use client';

import { useState } from 'react';
import * as Diff from 'diff';

interface DiffViewerProps {
  original: string;
  optimized: string;
}

export default function DiffViewer({ original, optimized }: DiffViewerProps) {
  const [open, setOpen] = useState(false);

  if (!original || !optimized) return null;

  const diffs = Diff.diffWords(original, optimized);

  return (
    <div className="border-t border-gray-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-purple-500">{open ? '▼' : '▶'}</span>
          Word diff
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-400 mb-2 flex gap-4">
            <span><span className="inline-block w-3 h-3 rounded-sm bg-red-100 border border-red-300 mr-1" />Removed</span>
            <span><span className="inline-block w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300 mr-1" />Added</span>
          </p>
          <div className="text-sm font-mono leading-relaxed bg-gray-50 rounded-lg border border-gray-200 p-3 max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
            {diffs.map((part, i) => {
              if (part.added) {
                return (
                  <span key={i} className="bg-emerald-100 text-emerald-800 rounded px-0.5">
                    {part.value}
                  </span>
                );
              }
              if (part.removed) {
                return (
                  <span key={i} className="bg-red-100 text-red-700 line-through rounded px-0.5">
                    {part.value}
                  </span>
                );
              }
              return <span key={i} className="text-gray-600">{part.value}</span>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
