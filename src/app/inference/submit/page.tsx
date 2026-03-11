'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SectionHeader from '@/components/SectionHeader';
import { useTranslation } from '@/components/LocaleProvider';
import { apiUrl } from '@/lib/client-api';

type ModelInfo = {
  name: string;
  version: string;
  minTier: string;
  minMemoryMb: number;
};

export default function SubmitTaskPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const preselectedModel = searchParams.get('model') ?? '';

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState(preselectedModel);
  const [inputData, setInputData] = useState('');
  const [maxFee, setMaxFee] = useState('1000000000000000'); // 0.001 QFC in wei
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ taskId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch(apiUrl('/inference'));
        const json = await res.json();
        if (json.ok && json.data?.models) {
          const approved = json.data.models.filter((m: ModelInfo & { approved: boolean }) => m.approved);
          setModels(approved);
          if (!selectedModel && approved.length > 0) {
            setSelectedModel(approved[0].name);
          }
        }
      } catch {
        setError('Failed to load models');
      } finally {
        setLoading(false);
      }
    }
    fetchModels();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = models.find((m) => m.name === selectedModel);

  const feeInQfc = (() => {
    try {
      const wei = BigInt(maxFee || '0');
      const whole = wei / 10n ** 18n;
      const frac = wei % 10n ** 18n;
      if (frac === 0n) return `${whole}`;
      const fracStr = frac.toString().padStart(18, '0').replace(/0+$/, '');
      return `${whole}.${fracStr}`;
    } catch {
      return '0';
    }
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedModel || !inputData.trim()) return;

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      // Note: actual task submission requires a signed transaction.
      // This UI prepares the parameters; wallet integration needed for signing.
      setResult({ taskId: 'pending-wallet-connect' });
      setError('Wallet connection required. Task submission needs a signed transaction to the TaskRegistry contract.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader
          title={t('marketplace.submitTask')}
          description={t('marketplace.submitDescription')}
        />
        <Link
          href="/inference/marketplace"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          {t('marketplace.backToMarketplace')}
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60 space-y-6">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('marketplace.selectModel')}
          </label>
          {loading ? (
            <div className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ) : (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              {models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} (v{m.version}) — {m.minTier} tier
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Model Requirements */}
        {selected && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              {t('marketplace.modelRequirements')}
            </h4>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Tier: </span>
                <span className={`font-medium ${
                  selected.minTier === 'Hot' ? 'text-red-600 dark:text-red-400'
                    : selected.minTier === 'Warm' ? 'text-amber-600 dark:text-amber-400'
                      : 'text-cyan-600 dark:text-cyan-400'
                }`}>{selected.minTier}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">VRAM: </span>
                <span className="font-medium text-slate-900 dark:text-white">{selected.minMemoryMb} MB</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Version: </span>
                <span className="font-medium text-slate-900 dark:text-white">{selected.version}</span>
              </div>
            </div>
          </div>
        )}

        {/* Input Data */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('marketplace.inputData')}
          </label>
          <textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder={t('marketplace.inputPlaceholder')}
            rows={6}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 resize-y"
          />
        </div>

        {/* Max Fee */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('marketplace.maxFee')} (wei)
          </label>
          <input
            type="text"
            value={maxFee}
            onChange={(e) => setMaxFee(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            ≈ {feeInQfc} QFC
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            {error}
          </div>
        )}

        {/* Success */}
        {result && result.taskId !== 'pending-wallet-connect' && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-700 dark:bg-emerald-900/30">
            <p className="text-sm text-emerald-800 dark:text-emerald-300">
              Task submitted! ID: <Link href={`/task/${result.taskId}`} className="font-mono underline">{result.taskId}</Link>
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || !selectedModel || !inputData.trim()}
          className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t('marketplace.submitting') : t('marketplace.connectAndSubmit')}
        </button>
      </form>
    </main>
  );
}
