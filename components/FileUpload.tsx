'use client';

import { useRef, useState } from 'react';

interface FileUploadProps {
  onFileLoad: (content: string, fileName: string) => void;
  onClear: () => void;
  fileName: string | null;
}

const ACCEPTED_TYPES = ['.txt', '.md', '.csv', '.json', '.yaml', '.yml', '.xml', '.html', '.ts', '.tsx', '.js', '.jsx', '.py'];
const MAX_BYTES = 500_000; // 500 KB

export default function FileUpload({ onFileLoad, onClear, fileName }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function readFile(file: File) {
    setError(null);
    if (file.size > MAX_BYTES) {
      setError(`File too large (max 500 KB). Got ${(file.size / 1024).toFixed(0)} KB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileLoad(content, file.name);
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsText(file);
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    readFile(files[0]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="px-4 pt-3 pb-2">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Context File</span>
        <span className="text-xs text-gray-400">(optional — optimize prompt for this document)</span>
      </div>

      {fileName ? (
        /* Uploaded state */
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium text-indigo-700 flex-1 truncate">{fileName}</span>
          <button
            onClick={() => { onClear(); setError(null); }}
            className="text-indigo-400 hover:text-indigo-700 transition-colors ml-1 shrink-0"
            title="Remove file"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        /* Drop zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex items-center gap-3 border-2 border-dashed rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
            dragging
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <div>
            <p className="text-xs font-medium text-gray-600">
              Drop a file or <span className="text-indigo-600">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{ACCEPTED_TYPES.join(', ')} · max 500 KB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
