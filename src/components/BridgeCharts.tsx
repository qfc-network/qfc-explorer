'use client';

import { useState, useMemo } from 'react';

function generateMockSeries(days: number, base: number, variance: number): { date: string; value: number }[] {
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const trend = 1 + (i / days) * 0.1;
    const noise = 0.7 + Math.random() * 0.6;
    return {
      date: d.toISOString().slice(0, 10),
      value: Math.round(base * trend * noise),
    };
  });
}

type ChartConfig = {
  title: string;
  description: string;
  color: string;
  type: 'line' | 'area' | 'bar';
  formatValue: (v: number) => string;
  getData: (days: number) => { date: string; value: number }[];
};

const CHARTS: ChartConfig[] = [
  {
    title: 'Bridge Volume',
    description: 'Daily bridge transfer volume',
    color: '#a855f7',
    type: 'area',
    formatValue: (v) => `$${(v / 1000).toFixed(0)}K`,
    getData: (days) => generateMockSeries(days, 10000, 4000),
  },
  {
    title: 'Bridge Transactions',
    description: 'Number of bridge transfers per day',
    color: '#3b82f6',
    type: 'bar',
    formatValue: (v) => v.toLocaleString(),
    getData: (days) => generateMockSeries(days, 190, 60),
  },
  {
    title: 'Average Bridge Time',
    description: 'Median confirmation time in minutes',
    color: '#22c55e',
    type: 'line',
    formatValue: (v) => `${(v / 10).toFixed(1)} min`,
    getData: (days) => generateMockSeries(days, 42, 10).map((d) => ({ ...d, value: Math.max(15, Math.min(80, d.value)) })),
  },
  {
    title: 'Unique Bridge Users',
    description: 'Unique addresses using the bridge per day',
    color: '#f59e0b',
    type: 'line',
    formatValue: (v) => v.toLocaleString(),
    getData: (days) => generateMockSeries(days, 85, 30),
  },
];

const PERIODS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

export default function BridgeCharts() {
  const [days, setDays] = useState(30);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Charts</h2>
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

      <div className="grid gap-6 lg:grid-cols-2">
        {CHARTS.map((chart) => (
          <BridgeChart key={chart.title} chart={chart} days={days} />
        ))}
      </div>
    </div>
  );
}

function BridgeChart({ chart, days }: { chart: ChartConfig; days: number }) {
  const data = useMemo(() => chart.getData(days), [chart, days]);

  const points = useMemo(() => {
    const values = data.map((d) => d.value);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    return data.map((d, i) => ({
      x: (i / (data.length - 1 || 1)) * 100,
      y: ((d.value - min) / range) * 100,
      value: d.value,
      date: d.date,
    }));
  }, [data]);

  const total = points.reduce((sum, p) => sum + p.value, 0);
  const avg = points.length > 0 ? total / points.length : 0;
  const latest = points.length > 0 ? points[points.length - 1].value : 0;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${100 - p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} 100 L 0 100 Z`
    : '';

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
        <div className="relative h-40">
          {chart.type === 'bar' ? (
            <svg aria-hidden="true" viewBox={`0 0 ${points.length} 100`} preserveAspectRatio="none" className="h-full w-full">
              <line x1="0" y1="50" x2={points.length} y2="50" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
              {points.map((p, i) => (
                <g key={i}>
                  <rect x={i + 0.15} y={100 - p.y} width={0.7} height={p.y} fill={chart.color} opacity={0.7} rx={0.15} />
                  <title>{`${p.date}: ${chart.formatValue(p.value)}`}</title>
                </g>
              ))}
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
              <line x1="0" y1="50" x2="100" y2="50" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
              {chart.type === 'area' && <path d={areaPath} fill={`${chart.color}15`} />}
              <path d={linePath} fill="none" stroke={chart.color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
              {points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={100 - p.y} r="3" fill={chart.color} className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer" />
                  <title>{`${p.date}: ${chart.formatValue(p.value)}`}</title>
                </g>
              ))}
            </svg>
          )}
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
