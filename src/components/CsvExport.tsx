'use client';

import { useCallback } from 'react';
import { useTranslation } from '@/components/LocaleProvider';

type Column = {
  key: string;
  label: string;
};

type Props = {
  data: Record<string, unknown>[];
  filename: string;
  columns: Column[];
};

function escapeCsvField(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function CsvExport({ data, filename, columns }: Props) {
  const { t } = useTranslation();

  const handleExport = useCallback(() => {
    if (data.length === 0) return;

    const header = columns.map((c) => escapeCsvField(c.label)).join(',');
    const rows = data.map((row) =>
      columns.map((c) => escapeCsvField(row[c.key])).join(',')
    );
    const csv = [header, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data, filename, columns]);

  if (data.length === 0) return null;

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-xs uppercase tracking-[0.15em] text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
      title={t('common.exportCsv')}
    >
      <svg
        aria-hidden="true"
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      CSV
    </button>
  );
}
