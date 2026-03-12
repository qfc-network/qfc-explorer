'use client';

import { useState, useMemo } from 'react';

function generateMockSeries(days: number, base: number, growth: number): { date: string; value: number }[] {
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const trend = 1 + (i / days) * growth;
    const noise = 0.92 + Math.random() * 0.16;
    return {
      date: d.toISOString().slice(0, 10),
      value: Math.round(base * trend * noise),
    };
  });
}

type StackedPoint = { date: string; values: number[]; total: number };

function generateStackedSeries(days: number): StackedPoint[] {
  const protocols = [
    { base: 4000000, growth: 0.2 },  // QUSD CDP
    { base: 3000000, growth: 0.15 }, // Lending
    { base: 2500000, growth: 0.25 }, // stQFC
    { base: 1500000, growth: 0.3 },  // Yield Vaults
    { base: 400000,  growth: 0.5 },  // Launchpad
  ];
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const values = protocols.map((p) => {
      const trend = 1 + (i / days) * p.growth;
      const noise = 0.92 + Math.random() * 0.16;
      return Math.round(p.base * trend * noise);
    });
    return {
      date: d.toISOString().slice(0, 10),
      values,
      total: values.reduce((a, b) => a + b, 0),
    };
  });
}

const PROTOCOL_COLORS = ['#a855f7', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];
const PROTOCOL_NAMES = ['QUSD CDP', 'Lending', 'stQFC', 'Yield Vaults', 'Launchpad'];

type SimpleChartConfig = {
  title: string;
  description: string;
  color: string;
  formatValue: (v: number) => string;
  getData: (days: number) => { date: string; value: number }[];
};

const SIMPLE_CHARTS: SimpleChartConfig[] = [
  {
    title: 'QUSD Supply',
    description: 'Total QUSD stablecoin in circulation',
    color: '#a855f7',
    formatValue: (v) => `${(v / 1e6).toFixed(2)}M`,
    getData: (days) => generateMockSeries(days, 1800000, 0.2),
  },
  {
    title: 'Lending Utilization',
    description: 'Average utilization rate across lending pools',
    color: '#f59e0b',
    formatValue: (v) => `${v}%`,
    getData: (days) => generateMockSeries(days, 55, 0.1).map((d) => ({ ...d, value: Math.min(95, Math.max(20, d.value)) })),
  },
  {
    title: 'stQFC Staking Ratio',
    description: '% of total QFC supply staked',
    color: '#3b82f6',
    formatValue: (v) => `${v}%`,
    getData: (days) => generateMockSeries(days, 30, 0.15).map((d) => ({ ...d, value: Math.min(60, Math.max(15, d.value)) })),
  },
];

const PERIODS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

export default function DefiCharts() {
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

      {/* Stacked TVL chart — full width */}
      <StackedTvlChart days={days} />

      {/* Simple charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {SIMPLE_CHARTS.map((chart) => (
          <SimpleChart key={chart.title} chart={chart} days={days} />
        ))}
      </div>
    </div>
  );
}

function StackedTvlChart({ days }: { days: number }) {
  const data = useMemo(() => generateStackedSeries(days), [days]);
  const maxTotal = useMemo(() => Math.max(...data.map((d) => d.total), 1), [data]);
  const latest = data.length > 0 ? data[data.length - 1] : null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-white">Total TVL by Protocol</h3>
          <p className="text-xs text-slate-500">Stacked breakdown across all DeFi protocols</p>
        </div>
        {latest && (
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900 dark:text-white">${(latest.total / 1e6).toFixed(2)}M</p>
          </div>
        )}
      </div>

      <div className="relative h-48">
        <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          {PROTOCOL_COLORS.map((color, layerIdx) => {
            const reversedIdx = PROTOCOL_COLORS.length - 1 - layerIdx;
            const path = data.map((d, i) => {
              const x = (i / (data.length - 1 || 1)) * 100;
              const cumAbove = d.values.slice(0, reversedIdx + 1).reduce((a, b) => a + b, 0);
              const y = 100 - (cumAbove / maxTotal) * 100;
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ');

            const cumBelow = data.map((d, i) => {
              const x = (i / (data.length - 1 || 1)) * 100;
              const below = d.values.slice(0, reversedIdx).reduce((a, b) => a + b, 0);
              return `${x} ${100 - (below / maxTotal) * 100}`;
            });

            const closePath = cumBelow.length > 0
              ? ` L ${cumBelow.reverse().map((p) => p).join(' L ')} Z`
              : ` L 100 100 L 0 100 Z`;

            return (
              <path key={layerIdx} d={`${path}${closePath}`} fill={PROTOCOL_COLORS[reversedIdx]} opacity={0.5} />
            );
          })}
        </svg>
        <div className="mt-1 flex justify-between text-[10px] text-slate-600">
          <span>{data[0]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {PROTOCOL_NAMES.map((name, i) => (
          <div key={name} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PROTOCOL_COLORS[i] }} />
            <span className="text-xs text-slate-500">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleChart({ chart, days }: { chart: SimpleChartConfig; days: number }) {
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

  const latest = points.length > 0 ? points[points.length - 1].value : 0;
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${100 - p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} 100 L 0 100 Z`
    : '';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-5">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white">{chart.title}</h3>
        <p className="text-xs text-slate-500">{chart.description}</p>
      </div>
      <p className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">{chart.formatValue(latest)}</p>

      {points.length > 1 && (
        <div className="relative h-24">
          <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
            <path d={areaPath} fill={`${chart.color}15`} />
            <path d={linePath} fill="none" stroke={chart.color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="mt-1 flex justify-between text-[10px] text-slate-600">
            <span>{points[0]?.date}</span>
            <span>{points[points.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </div>
  );
}
