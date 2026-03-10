'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiUrl } from '@/lib/client-api';

type DailyStat = {
  date: string;
  tx_count: number;
  active_addresses: number;
  new_contracts: number;
  total_gas_used: string;
  avg_gas_price: number;
  block_count: number;
  avg_block_time_ms: number;
};

type ChartConfig = {
  title: string;
  description: string;
  color: string;
  getValue: (s: DailyStat) => number;
  formatValue: (v: number) => string;
  yLabel: string;
  type: 'line' | 'bar';
};

const CHARTS: ChartConfig[] = [
  {
    title: 'Daily Transactions',
    description: 'Number of on-chain transactions per day',
    color: '#a855f7',
    getValue: (s) => s.tx_count,
    formatValue: (v) => v.toLocaleString(),
    yLabel: 'Txs',
    type: 'line',
  },
  {
    title: 'Daily Active Addresses',
    description: 'Unique addresses active per day',
    color: '#22c55e',
    getValue: (s) => s.active_addresses,
    formatValue: (v) => v.toLocaleString(),
    yLabel: 'Addresses',
    type: 'line',
  },
  {
    title: 'Average Gas Price',
    description: 'Mean gas price across all daily transactions',
    color: '#f59e0b',
    getValue: (s) => s.avg_gas_price / 1e9,
    formatValue: (v) => `${v.toFixed(2)} Gwei`,
    yLabel: 'Gwei',
    type: 'line',
  },
  {
    title: 'Block Size (Avg Txs per Block)',
    description: 'Average number of transactions per block each day',
    color: '#3b82f6',
    getValue: (s) => s.block_count > 0 ? s.tx_count / s.block_count : 0,
    formatValue: (v) => v.toFixed(2),
    yLabel: 'Txs/Block',
    type: 'bar',
  },
  {
    title: 'Average Block Time',
    description: 'Mean time between blocks per day',
    color: '#ef4444',
    getValue: (s) => s.avg_block_time_ms / 1000,
    formatValue: (v) => `${v.toFixed(2)}s`,
    yLabel: 'Seconds',
    type: 'line',
  },
];

const PERIODS = [
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

export default function ChartsClient() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(apiUrl(`/api/analytics/daily?days=${days}`))
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setData(res.data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Time Range</h2>
        <div className="flex gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                days === p.days
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div aria-live="polite" aria-busy="true" className="grid gap-6 lg:grid-cols-2">
          {CHARTS.map((_, i) => (
            <div key={i} role="status" aria-label="Loading" className="h-72 animate-pulse rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-12 text-center text-slate-500">
          No daily data available yet. The indexer needs to populate daily stats.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {CHARTS.map((chart) => (
            <ChartCard key={chart.title} chart={chart} data={data} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChartCard({ chart, data }: { chart: ChartConfig; data: DailyStat[] }) {
  const points = useMemo(() => {
    const values = data.map((d) => chart.getValue(d));
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    return data.map((d, i) => {
      const value = chart.getValue(d);
      return {
        x: (i / (data.length - 1 || 1)) * 100,
        y: ((value - min) / range) * 100,
        value,
        date: d.date,
      };
    });
  }, [data, chart]);

  const total = points.reduce((sum, p) => sum + p.value, 0);
  const avg = points.length > 0 ? total / points.length : 0;
  const latest = points.length > 0 ? points[points.length - 1].value : 0;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-white">{chart.title}</h3>
          <p className="text-xs text-slate-500">{chart.description}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900 dark:text-white">{chart.formatValue(latest)}</p>
          <p className="text-[10px] text-slate-500">avg: {chart.formatValue(avg)}</p>
        </div>
      </div>

      {points.length > 1 ? (
        chart.type === 'bar' ? (
          <BarChart points={points} color={chart.color} formatValue={chart.formatValue} />
        ) : (
          <LineChart points={points} color={chart.color} formatValue={chart.formatValue} />
        )
      ) : (
        <div className="flex h-48 items-center justify-center text-xs text-slate-500">
          Insufficient data
        </div>
      )}
    </div>
  );
}

type ChartPoint = { x: number; y: number; value: number; date: string };

function LineChart({ points, color, formatValue }: { points: ChartPoint[]; color: string; formatValue: (v: number) => string }) {
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${100 - p.y}`)
    .join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x} 100 L 0 100 Z`;

  return (
    <div className="relative h-48">
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <line x1="0" y1="50" x2="100" y2="50" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
        <path d={areaPath} fill={`${color}15`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={100 - p.y}
              r="3"
              fill={color}
              className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            />
            <title>{`${p.date}: ${formatValue(p.value)}`}</title>
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-slate-600">
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function BarChart({ points, color, formatValue }: { points: ChartPoint[]; color: string; formatValue: (v: number) => string }) {
  const maxY = Math.max(...points.map((p) => p.y), 1);
  const barWidth = 100 / points.length;
  const barGap = barWidth * 0.15;

  return (
    <div className="relative h-48">
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <line x1="0" y1="50" x2="100" y2="50" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1="0" y1="100" x2="100" y2="100" stroke="#334155" strokeWidth="0.5" />
        {points.map((p, i) => {
          const height = maxY > 0 ? (p.y / maxY) * 100 : 0;
          const x = i * barWidth + barGap;
          const w = barWidth - barGap * 2;
          return (
            <g key={i}>
              <rect
                x={x}
                y={100 - height}
                width={Math.max(w, 0.5)}
                height={height}
                fill={color}
                opacity={0.7}
                className="hover:opacity-100 transition-opacity cursor-pointer"
              />
              <title>{`${p.date}: ${formatValue(p.value)}`}</title>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-slate-600">
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
}
