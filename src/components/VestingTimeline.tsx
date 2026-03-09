'use client';

import { useMemo } from 'react';
import { formatHexWeiToQfc } from '@/lib/qfc-format';

type Tranche = {
  blockHeight: string;
  amount: string;
  vested: string;
  startTime: string;
  cliffEnd: string;
  endTime: string;
  percentVested: number;
};

type Props = {
  tranches: Tranche[];
};

function formatCountdown(targetMs: number): string {
  const now = Date.now();
  const diff = targetMs - now;
  if (diff <= 0) return 'Unlocked';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m remaining`;
}

function formatDate(ms: string | number): string {
  const d = new Date(Number(ms));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function VestingTimeline({ tranches }: Props) {
  if (!tranches || tranches.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Vesting Timeline</h3>

      <div className="space-y-5">
        {tranches.map((tranche, idx) => {
          const startMs = Number(tranche.startTime);
          const cliffMs = Number(tranche.cliffEnd);
          const endMs = Number(tranche.endTime);
          const now = Date.now();
          const totalDuration = endMs - startMs || 1;
          const cliffPct = Math.min(100, ((cliffMs - startMs) / totalDuration) * 100);
          const currentPct = Math.min(100, Math.max(0, ((now - startMs) / totalDuration) * 100));
          const isCliffActive = now < cliffMs;

          // Determine next unlock event
          let nextEvent: string;
          if (now < cliffMs) {
            nextEvent = `Cliff ends: ${formatCountdown(cliffMs)}`;
          } else if (now < endMs) {
            nextEvent = `Fully vests: ${formatCountdown(endMs)}`;
          } else {
            nextEvent = 'Fully vested';
          }

          return (
            <div key={idx} className="space-y-2">
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Block #{tranche.blockHeight}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatHexWeiToQfc(tranche.amount)} QFC
                  </span>
                </div>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {tranche.percentVested}% vested
                </span>
              </div>

              {/* Timeline bar */}
              <div className="relative h-6 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                {/* Cliff zone */}
                <div
                  className="absolute inset-y-0 left-0 bg-amber-500/30 dark:bg-amber-500/20"
                  style={{ width: `${cliffPct}%` }}
                  title={`Cliff period: ${formatDate(tranche.startTime)} - ${formatDate(tranche.cliffEnd)}`}
                />

                {/* Vested progress */}
                <div
                  className="absolute inset-y-0 left-0 bg-emerald-500/60 dark:bg-emerald-500/40 transition-all duration-500"
                  style={{ width: `${Math.min(100, tranche.percentVested)}%` }}
                />

                {/* Current position indicator */}
                {currentPct > 0 && currentPct < 100 && (
                  <div
                    className="absolute inset-y-0 w-0.5 bg-white dark:bg-slate-200 shadow-sm"
                    style={{ left: `${currentPct}%` }}
                    title="Current position"
                  />
                )}

                {/* Labels within bar */}
                <div className="absolute inset-0 flex items-center px-2">
                  {cliffPct > 15 && (
                    <span
                      className="text-[9px] font-medium text-amber-800 dark:text-amber-300 truncate"
                      style={{ width: `${cliffPct}%` }}
                    >
                      Cliff
                    </span>
                  )}
                </div>
              </div>

              {/* Date labels */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                <span>{formatDate(tranche.startTime)}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                  {nextEvent}
                </span>
                <span>{formatDate(tranche.endTime)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
