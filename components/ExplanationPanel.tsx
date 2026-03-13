'use client';

import { useState } from 'react';

interface ExplanationPanelProps {
  changes: string[];
  qualityNotes: string | null;
}

export default function ExplanationPanel({ changes, qualityNotes }: ExplanationPanelProps) {
  const [open, setOpen] = useState(true);

  if (changes.length === 0) return null;

  return (
    <div className="border-t border-gray-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-indigo-500">
            {open ? '▼' : '▶'}
          </span>
          Changes made
          <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
            {changes.length}
          </span>
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-1.5">
          <ul className="space-y-1.5">
            {changes.map((change, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                <span>{change}</span>
              </li>
            ))}
          </ul>
          {qualityNotes && (
            <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded px-3 py-2 border border-gray-100">
              <span className="font-medium text-gray-600">Note: </span>
              {qualityNotes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
