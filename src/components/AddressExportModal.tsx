'use client';

import { useState, useCallback, useEffect } from 'react';
import { getApiBaseUrl } from '@/lib/api-client';
import { useTranslation } from '@/components/LocaleProvider';

type Props = {
  address: string;
  type: 'transactions' | 'token_transfers';
  onClose: () => void;
};

const MAX_ROW_OPTIONS = [1000, 2500, 5000] as const;

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatDate(d);
}

export default function AddressExportModal({ address, type, onClose }: Props) {
  const { t } = useTranslation();
  const [fromDate, setFromDate] = useState(daysAgo(30));
  const [toDate, setToDate] = useState(formatDate(new Date()));
  const [maxRows, setMaxRows] = useState<number>(1000);
  const [downloading, setDownloading] = useState(false);
  const [estimatedRows, setEstimatedRows] = useState<number | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Fetch estimated row count when date range changes
  useEffect(() => {
    const controller = new AbortController();
    const base = getApiBaseUrl();
    const apiBase = base || '';

    // Use the new txs/export endpoint with limit=1 just to get the X-Total-Count header
    let url: string;
    if (type === 'transactions') {
      url = `${apiBase}/address/${address}/txs/export?limit=1`;
    } else {
      url = `${apiBase}/address/${address}/export?type=token_transfers&limit=100`;
    }
    if (fromDate) url += `&from_date=${fromDate}`;
    if (toDate) url += `&to_date=${toDate}`;

    if (type === 'transactions') {
      fetch(url, { signal: controller.signal, method: 'HEAD' })
        .catch(() => fetch(url, { signal: controller.signal }))
        .then((r) => {
          const total = r.headers.get('X-Total-Count');
          if (total) {
            setEstimatedRows(Number(total));
          } else {
            // Fall back: count CSV lines
            return r.text().then((text) => {
              const lines = text.split('\n').length - 1; // subtract header
              setEstimatedRows(lines > 0 ? lines : null);
            });
          }
        })
        .catch(() => {
          setEstimatedRows(null);
        });
    } else {
      setEstimatedRows(null);
    }

    return () => controller.abort();
  }, [address, type, fromDate, toDate]);

  const applyPreset = useCallback((days: number | null) => {
    if (days === null) {
      setFromDate('');
      setToDate('');
    } else {
      setFromDate(daysAgo(days));
      setToDate(formatDate(new Date()));
    }
  }, []);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const base = getApiBaseUrl();
      const apiBase = base || '';

      let url: string;
      if (type === 'transactions') {
        url = `${apiBase}/address/${address}/txs/export?limit=${maxRows}`;
        if (fromDate) url += `&from_date=${fromDate}`;
        if (toDate) url += `&to_date=${toDate}`;
      } else {
        url = `${apiBase}/address/${address}/export?type=token_transfers&limit=${maxRows}`;
        if (fromDate) url += `&start_date=${fromDate}`;
        if (toDate) url += `&end_date=${toDate}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `qfc-${address.slice(0, 10)}-${type}-${fromDate || 'all'}-to-${toDate || 'now'}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, [address, type, fromDate, toDate, maxRows, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('export.title')}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Date Range */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
            {t('export.dateRange')}
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-slate-500">{t('export.from')}</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-slate-500">{t('export.to')}</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
            {t('export.presets')}
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: t('export.last7days'), days: 7 },
              { label: t('export.last30days'), days: 30 },
              { label: t('export.last90days'), days: 90 },
              { label: t('export.allTime'), days: null },
            ].map((preset) => {
              const isActive = preset.days === null
                ? (!fromDate && !toDate)
                : (fromDate === daysAgo(preset.days) && toDate === formatDate(new Date()));
              return (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset.days)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Max Rows */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
            {t('export.maxRows')}
          </label>
          <div className="flex gap-2">
            {MAX_ROW_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setMaxRows(opt)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  maxRows === opt
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Format */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
            {t('export.format')}
          </label>
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg bg-cyan-500/20 border border-cyan-500/30 py-2 text-center text-sm font-medium text-cyan-400">
              {t('export.csvFormat')}
            </div>
          </div>
        </div>

        {/* Estimated rows */}
        {estimatedRows !== null && (
          <div className="mb-4 rounded-lg bg-slate-100 dark:bg-slate-800/60 px-3 py-2 text-xs text-slate-400">
            {t('export.estimatedRows').replace('{count}', estimatedRows.toLocaleString())}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {t('export.cancel')}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-600 py-2.5 text-sm font-medium text-slate-900 dark:text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors"
          >
            {downloading ? (
              <>
                <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('export.downloading')}
              </>
            ) : (
              <>
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('export.download')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
