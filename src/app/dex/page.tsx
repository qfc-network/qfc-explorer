'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import SectionHeader from '@/components/SectionHeader';
import { useTranslation } from '@/components/LocaleProvider';
import { TOKENS, getAmountOut } from '@/lib/dex';
import { shortenHash } from '@/lib/format';

/* ---------- Mock data (replace with live API/contract reads later) ---------- */

const MOCK_POOLS = [
  { pair: 'QFC / TTK', reserve0: '125,000.00', reserve1: '3,400,000.00', volume24h: '48,230.12' },
  { pair: 'QFC / QDOGE', reserve0: '80,500.00', reserve1: '12,000,000.00', volume24h: '31,870.55' },
  { pair: 'TTK / QDOGE', reserve0: '1,200,000.00', reserve1: '5,600,000.00', volume24h: '12,450.80' },
];

const MOCK_SWAPS = [
  { txHash: '0x8a3f…c921', from: 'QFC', to: 'TTK', amount: '50.00', time: '2 min ago' },
  { txHash: '0x1b7e…d034', from: 'TTK', to: 'QDOGE', amount: '12,500.00', time: '5 min ago' },
  { txHash: '0xf42c…a817', from: 'QDOGE', to: 'QFC', amount: '800,000.00', time: '8 min ago' },
  { txHash: '0x3d91…b562', from: 'QFC', to: 'QDOGE', amount: '120.00', time: '12 min ago' },
  { txHash: '0x6e0a…7f48', from: 'TTK', to: 'QFC', amount: '5,000.00', time: '15 min ago' },
];

/* Mock reserves for quote calculation (18-decimal BigInt values) */
const MOCK_RESERVES: Record<string, { reserveIn: bigint; reserveOut: bigint }> = {
  'QFC→TTK': { reserveIn: 125000n * 10n ** 18n, reserveOut: 3400000n * 10n ** 18n },
  'TTK→QFC': { reserveIn: 3400000n * 10n ** 18n, reserveOut: 125000n * 10n ** 18n },
  'QFC→QDOGE': { reserveIn: 80500n * 10n ** 18n, reserveOut: 12000000n * 10n ** 18n },
  'QDOGE→QFC': { reserveIn: 12000000n * 10n ** 18n, reserveOut: 80500n * 10n ** 18n },
  'TTK→QDOGE': { reserveIn: 1200000n * 10n ** 18n, reserveOut: 5600000n * 10n ** 18n },
  'QDOGE→TTK': { reserveIn: 5600000n * 10n ** 18n, reserveOut: 1200000n * 10n ** 18n },
};

/* ---------- Component ---------- */

export default function DexPage() {
  const { t } = useTranslation();

  const [fromIdx, setFromIdx] = useState(0); // QFC
  const [toIdx, setToIdx] = useState(1); // TTK
  const [amountStr, setAmountStr] = useState('');

  const fromToken = TOKENS[fromIdx];
  const toToken = TOKENS[toIdx];

  const estimatedOutput = useMemo(() => {
    const val = parseFloat(amountStr);
    if (!val || val <= 0) return '';
    const key = `${fromToken.symbol}→${toToken.symbol}`;
    const reserves = MOCK_RESERVES[key];
    if (!reserves) return '—';
    const amountIn = BigInt(Math.floor(val * 1e18));
    const out = getAmountOut(amountIn, reserves.reserveIn, reserves.reserveOut);
    const outNum = Number(out) / 1e18;
    return outNum.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }, [amountStr, fromToken.symbol, toToken.symbol]);

  function handleFlip() {
    setFromIdx(toIdx);
    setToIdx(fromIdx);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      <SectionHeader
        title={t('dex.title')}
        description={t('dex.description')}
      />

      {/* ---- Swap Widget ---- */}
      <section className="mx-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t('dex.swap')}
        </h2>

        {/* From */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('dex.from')}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.0"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full bg-transparent text-2xl font-medium text-slate-900 placeholder-slate-400 outline-none dark:text-white dark:placeholder-slate-500"
            />
            <select
              value={fromIdx}
              onChange={(e) => {
                const idx = Number(e.target.value);
                if (idx === toIdx) setToIdx(fromIdx);
                setFromIdx(idx);
              }}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            >
              {TOKENS.map((tok, i) => (
                <option key={tok.symbol} value={i}>{tok.symbol}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Flip button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={handleFlip}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
            aria-label="Flip tokens"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* To */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('dex.to')}
          </label>
          <div className="flex items-center gap-3">
            <div className="w-full text-2xl font-medium text-slate-900 dark:text-white">
              {estimatedOutput || <span className="text-slate-400 dark:text-slate-500">0.0</span>}
            </div>
            <select
              value={toIdx}
              onChange={(e) => {
                const idx = Number(e.target.value);
                if (idx === fromIdx) setFromIdx(toIdx);
                setToIdx(idx);
              }}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            >
              {TOKENS.map((tok, i) => (
                <option key={tok.symbol} value={i}>{tok.symbol}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fee note */}
        {estimatedOutput && (
          <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
            {t('dex.estimatedOutput')}: {estimatedOutput} {toToken.symbol} &middot; {t('dex.feeNote')}
          </p>
        )}

        {/* Connect wallet button */}
        <button className="mt-4 w-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90">
          {t('dex.connectWallet')}
        </button>
      </section>

      {/* ---- Top Pools ---- */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t('dex.topPools')}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80">
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('dex.pair')}</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">{t('dex.reserves')}</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">{t('dex.volume24h')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {MOCK_POOLS.map((pool) => (
                <tr key={pool.pair} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{pool.pair}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                    {pool.reserve0} / {pool.reserve1}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    ${pool.volume24h}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- Recent Swaps ---- */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t('dex.recentSwaps')}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80">
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('dex.txHash')}</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('dex.fromToken')}</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('dex.toToken')}</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">{t('dex.swapAmount')}</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">{t('dex.time')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {MOCK_SWAPS.map((swap) => (
                <tr key={swap.txHash} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <span className="font-mono text-cyan-500">{swap.txHash}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {swap.from}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {swap.to}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                    {swap.amount}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                    {swap.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
