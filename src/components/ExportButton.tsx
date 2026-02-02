'use client';

import { useState } from 'react';

type Props = {
  endpoint: string;
  filename: string;
  formats?: ('json' | 'csv')[];
};

export default function ExportButton({
  endpoint,
  filename,
  formats = ['csv', 'json'],
}: Props) {
  const [exporting, setExporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true);
    setShowDropdown(false);

    try {
      const separator = endpoint.includes('?') ? '&' : '?';
      const url = `${endpoint}${separator}format=${format}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${filename}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={exporting}
        className="flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200 hover:bg-slate-800 disabled:opacity-50 transition-colors"
      >
        {exporting ? (
          <>
            <LoadingSpinner />
            Exporting...
          </>
        ) : (
          <>
            <DownloadIcon />
            Export
          </>
        )}
      </button>

      {showDropdown && !exporting && (
        <div className="absolute right-0 top-full mt-2 z-10 rounded-lg border border-slate-700 bg-slate-800 shadow-lg overflow-hidden">
          {formats.includes('csv') && (
            <button
              onClick={() => handleExport('csv')}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <CsvIcon />
              Export as CSV
            </button>
          )}
          {formats.includes('json') && (
            <button
              onClick={() => handleExport('json')}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <JsonIcon />
              Export as JSON
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function CsvIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function JsonIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}
