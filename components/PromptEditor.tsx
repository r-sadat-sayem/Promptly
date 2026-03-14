'use client';

import { useEffect, useRef } from 'react';
import { countTokens } from '@/lib/tokenCounter';

interface PromptEditorProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  tokenCount: number;
  highlight?: boolean;
}

export default function PromptEditor({
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
  tokenCount,
  highlight = false,
}: PromptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 240)}px`;
  }, [value]);

  return (
    <div className={`flex flex-col flex-1 min-w-0 border-r last:border-r-0 border-gray-200 ${highlight ? 'bg-emerald-50/30' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-xs text-gray-500 tabular-nums">
          <span className="font-semibold text-gray-700">{tokenCount.toLocaleString()}</span> tokens
        </span>
      </div>

      {/* Textarea */}
      <div className="flex-1 p-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`w-full h-full min-h-[240px] p-3 text-sm font-mono leading-relaxed resize-none outline-none bg-transparent text-gray-800 placeholder-gray-400 ${
            readOnly ? 'cursor-default' : ''
          }`}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
