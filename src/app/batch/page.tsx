'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/client-api';
import { formatQfcAmount } from '@/lib/qfc-format';
import { useTranslation } from '@/components/LocaleProvider';
import type { ApiBatchAddresses, ApiBatchAddressItem } from '@/lib/api-types';
import type { TranslationKey } from '@/lib/translations';

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const MAX_ADDRESSES = 20;

function exportCsv(addresses: ApiBatchAddressItem[], t: (key: TranslationKey) => string) {
  const headers = [
    t('batch.address'),
    t('batch.balance'),
    t('batch.nonce'),
    t('batch.sent'),
    t('batch.received'),
    t('batch.label'),
    t('batch.type'),
  ];
  const rows = addresses.map((a) => [
    a.address,
    formatQfcAmount(a.balance),
    a.nonce,
    a.tx_count.sent,
    a.tx_count.received,
    a.label ?? '',
    a.is_contract ? 'Contract' : 'EOA',
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `qfc-batch-addresses-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BatchPage() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [results, setResults] = useState<ApiBatchAddressItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setResults(null);

    const lines = input
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    if (lines.length > MAX_ADDRESSES) {
      setError(t('batch.tooMany'));
      return;
    }

    for (const line of lines) {
      if (!ADDRESS_RE.test(line)) {
        setError(t('batch.invalidAddress'));
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/batch/addresses'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses: lines }),
      });
      const json = (await res.json()) as ApiBatchAddresses | { ok: false; error: string };
      if (!json.ok) {
        setError((json as { error: string }).error || t('batch.error'));
        return;
      }
      setResults((json as ApiBatchAddresses).data.addresses);
    } catch {
      setError(t('batch.error'));
    } finally {
      setLoading(false);
    }
  }, [input, t]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{t('batch.title')}</h1>
      <p className="mt-1 text-sm text-slate-400">{t('batch.description')}</p>

      {/* Input form */}
      <section className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
          {t('batch.inputLabel')}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('batch.inputPlaceholder')}
          rows={6}
          className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
        />
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
        <div className="mt-3 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-medium text-slate-900 dark:text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors"
          >
            {loading ? t('batch.querying') : t('batch.submit')}
          </button>
          {results && results.length > 0 && (
            <button
              onClick={() => exportCsv(results, t)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {t('batch.exportCsv')}
            </button>
          )}
        </div>
      </section>

      {/* Results table */}
      {results && results.length > 0 && (
        <section className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-medium text-slate-900 dark:text-white">
              {t('batch.results')} ({results.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200 dark:border-slate-800/50">
                  <th className="px-4 py-3 font-medium">{t('batch.address')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('batch.balance')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('batch.nonce')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('batch.txCount')}</th>
                  <th className="px-4 py-3 font-medium">{t('batch.label')}</th>
                  <th className="px-4 py-3 font-medium">{t('batch.type')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
                {results.map((item) => (
                  <tr key={item.address} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/address/${item.address}`}
                        className="font-mono text-xs text-cyan-400 hover:text-cyan-300"
                      >
                        {item.address}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-900 dark:text-white">
                      {formatQfcAmount(item.balance)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-300">
                      {item.nonce}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600 dark:text-slate-300">
                      <span className="text-emerald-400">{item.tx_count.sent}</span>
                      {' / '}
                      <span className="text-blue-400">{item.tx_count.received}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {item.label ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          item.is_contract
                            ? 'bg-purple-500/10 text-purple-400'
                            : 'bg-slate-500/10 text-slate-400'
                        }`}
                      >
                        {item.is_contract ? t('batch.contract') : t('batch.eoa')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {results && results.length === 0 && (
        <p className="mt-6 text-center text-sm text-slate-500">{t('batch.noResults')}</p>
      )}
    </main>
  );
}
