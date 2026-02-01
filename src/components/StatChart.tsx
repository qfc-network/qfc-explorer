'use client';

import { useMemo } from 'react';

type StatPoint = { label: string; value: number };

type StatChartProps = {
  title: string;
  points: StatPoint[];
  suffix?: string;
};

export default function StatChart({ title, points, suffix = '' }: StatChartProps) {
  const max = useMemo(() => Math.max(...points.map((p) => p.value), 1), [points]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <div className="mt-4 flex items-end gap-2">
        {points.map((point) => (
          <div key={point.label} className="flex-1">
            <div
              className="w-full rounded-full bg-slate-700/40"
              style={{ height: 60 }}
            >
              <div
                className="w-full rounded-full bg-emerald-400/70"
                style={{ height: `${Math.max(8, (point.value / max) * 60)}px` }}
                title={`${point.value}${suffix}`}
              />
            </div>
            <p className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-slate-500">
              {point.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
