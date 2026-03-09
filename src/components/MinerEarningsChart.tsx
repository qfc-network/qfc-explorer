'use client';

import { useMemo, useState } from 'react';
import { formatHexWeiToQfc } from '@/lib/qfc-format';

type Earning = {
  blockHeight: string;
  reward: string;
  timestamp: string;
};

type Props = {
  earnings: Earning[];
};

type Period = '24h' | '7d' | '30d' | 'all';

function hexWeiToNumber(hexWei: string): number {
  try {
    const wei = BigInt(hexWei.startsWith('0x') ? hexWei : `0x${hexWei}`);
    // Convert to QFC (18 decimals) as a float
    const whole = Number(wei / 10n ** 18n);
    const frac = Number(wei % 10n ** 18n) / 1e18;
    return whole + frac;
  } catch {
    return 0;
  }
}

function formatAxisValue(value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  if (value < 1 && value > 0) return value.toFixed(4);
  return value.toFixed(2);
}

export default function MinerEarningsChart({ earnings }: Props) {
  const [period, setPeriod] = useState<Period>('7d');

  const aggregated = useMemo(() => {
    if (!earnings || earnings.length === 0) return [];

    const now = Date.now();
    const cutoffs: Record<Period, number> = {
      '24h': now - 24 * 60 * 60 * 1000,
      '7d': now - 7 * 24 * 60 * 60 * 1000,
      '30d': now - 30 * 24 * 60 * 60 * 1000,
      all: 0,
    };

    const cutoff = cutoffs[period];
    const filtered = earnings.filter((e) => Number(e.timestamp) >= cutoff);

    if (filtered.length === 0) return [];

    // Aggregate by bucket
    const buckets = new Map<string, number>();

    for (const e of filtered) {
      const ts = Number(e.timestamp);
      const date = new Date(ts);
      let key: string;

      if (period === '24h') {
        // Aggregate hourly
        key = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
      } else {
        // Aggregate daily
        key = `${date.getMonth() + 1}/${date.getDate()}`;
      }

      const current = buckets.get(key) ?? 0;
      buckets.set(key, current + hexWeiToNumber(e.reward));
    }

    return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
  }, [earnings, period]);

  const chartData = useMemo(() => {
    if (aggregated.length === 0) {
      return { points: [], maxValue: 0, minValue: 0 };
    }

    const values = aggregated.map((d) => d.value);
    const maxValue = Math.max(...values, 0.0001);
    const minValue = 0;
    const range = maxValue - minValue || 1;

    const points = aggregated.map((d, i) => ({
      x: (i / (aggregated.length - 1 || 1)) * 100,
      y: ((d.value - minValue) / range) * 100,
      label: d.label,
      value: d.value,
    }));

    return { points, maxValue, minValue };
  }, [aggregated]);

  const periods: { key: Period; label: string }[] = [
    { key: '24h', label: '24h' },
    { key: '7d', label: '7d' },
    { key: '30d', label: '30d' },
    { key: 'all', label: 'All' },
  ];

  const { points, maxValue, minValue } = chartData;

  // Total for the period
  const periodTotal = aggregated.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Earnings Over Time</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total: {periodTotal.toFixed(4)} QFC
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                period === p.key
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {aggregated.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-sm text-slate-500 dark:text-slate-400">
          No earnings data for this period
        </div>
      ) : (
        <div className="relative" style={{ height: 220 }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 flex w-16 flex-col justify-between text-right text-xs text-slate-500 pr-2">
            <span>{formatAxisValue(maxValue)} QFC</span>
            <span>{formatAxisValue((maxValue + minValue) / 2)} QFC</span>
            <span>{formatAxisValue(minValue)}</span>
          </div>

          {/* Chart area */}
          <div className="absolute left-16 right-0 top-0 bottom-8">
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="h-full w-full"
            >
              {/* Grid lines */}
              <line x1="0" y1="0" x2="100" y2="0" stroke="#334155" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="0" y1="100" x2="100" y2="100" stroke="#334155" strokeWidth="0.5" />

              {/* Area fill */}
              {points.length > 1 && (
                <path
                  d={`${points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${100 - p.y}`).join(' ')} L ${points[points.length - 1].x} 100 L 0 100 Z`}
                  fill="#10b98120"
                />
              )}

              {/* Line */}
              {points.length > 1 && (
                <path
                  d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${100 - p.y}`).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              )}

              {/* Data points */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={100 - p.y}
                    r="3"
                    fill="#10b981"
                    className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  />
                  <title>{`${p.label}: ${p.value.toFixed(4)} QFC`}</title>
                </g>
              ))}
            </svg>
          </div>

          {/* X-axis labels */}
          <div className="absolute left-16 right-0 bottom-0 h-8 flex justify-between text-xs text-slate-500">
            {points
              .filter((_, i) => i % Math.ceil(points.length / 6) === 0 || i === points.length - 1)
              .map((p, i) => (
                <span key={i} className="text-center truncate" style={{ maxWidth: '60px' }}>
                  {p.label}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
