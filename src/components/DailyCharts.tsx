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
};

const CHARTS: ChartConfig[] = [
  {
    title: 'Daily Transaction Volume',
    description: 'Number of transactions per day',
    color: '#a855f7',
    getValue: (s) => s.tx_count,
    formatValue: (v) => v.toLocaleString(),
    yLabel: 'Txs',
  },
  {
    title: 'Daily Active Addresses',
    description: 'Unique addresses involved in transactions per day',
    color: '#22c55e',
    getValue: (s) => s.active_addresses,
    formatValue: (v) => v.toLocaleString(),
    yLabel: 'Addresses',
  },
  {
    title: 'Average Gas Price',
    description: 'Mean gas price across all transactions per day',
    color: '#f59e0b',
    getValue: (s) => s.avg_gas_price / 1e9,
    formatValue: (v) => `${v.toFixed(2)} Gwei`,
    yLabel: 'Gwei',
  },
  {
    title: 'Daily New Contracts',
    description: 'Number of new contracts deployed per day',
    color: '#3b82f6',
    getValue: (s) => s.new_contracts,
    formatValue: (v) => v.toLocaleString(),
    yLabel: 'Contracts',
  },
];

const PERIODS = [
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

export default function DailyCharts() {
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
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Daily Trends</h2>
        <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-800/50 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                days === p.days
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-500">
          No daily data available yet. Run migration 005 and wait for the indexer to populate daily stats.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {CHARTS.map((chart) => (
            <DailyChart key={chart.title} chart={chart} data={data} />
          ))}
        </div>
      )}
    </div>
  );
}

function DailyChart({ chart, data }: { chart: ChartConfig; data: DailyStat[] }) {
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

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${100 - p.y}`)
    .join(' ');

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} 100 L 0 100 Z`
    : '';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">{chart.title}</h3>
          <p className="text-xs text-slate-500">{chart.description}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-white">{chart.formatValue(latest)}</p>
          <p className="text-[10px] text-slate-500">avg: {chart.formatValue(avg)}</p>
        </div>
      </div>

      {points.length > 1 ? (
        <div className="relative h-40">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <line x1="0" y1="50" x2="100" y2="50" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
            <path d={areaPath} fill={`${chart.color}15`} />
            <path d={linePath} fill="none" stroke={chart.color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
            {points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={100 - p.y}
                  r="3"
                  fill={chart.color}
                  className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                />
                <title>{`${p.date}: ${chart.formatValue(p.value)}`}</title>
              </g>
            ))}
          </svg>
          <div className="mt-1 flex justify-between text-[10px] text-slate-600">
            <span>{points[0]?.date}</span>
            <span>{points[points.length - 1]?.date}</span>
          </div>
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center text-xs text-slate-500">
          Insufficient data
        </div>
      )}
    </div>
  );
}
