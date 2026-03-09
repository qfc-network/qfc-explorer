'use client';

import { useMemo } from 'react';

type StatPoint = { label: string; value: number };

type StatChartProps = {
  title: string;
  points: StatPoint[];
  suffix?: string;
};

export default function StatChart({ title, points, suffix = '' }: StatChartProps) {
  const displayPoints = points.slice(-10);
  const max = useMemo(() => Math.max(...displayPoints.map((p) => p.value), 1), [displayPoints]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>
      {displayPoints.length === 0 ? (
        <div className="mt-4 flex items-center justify-center h-[76px]">
          <p className="text-xs text-slate-400">No data yet</p>
        </div>
      ) : (
        <div className="mt-4 flex items-end gap-1">
          {displayPoints.map((point, idx) => (
            <div key={point.label} className="flex-1 min-w-0">
              <div
                className="w-full rounded-full bg-slate-200/60 dark:bg-slate-700/40"
                style={{ height: 60 }}
              >
                <div
                  className="w-full rounded-full bg-emerald-400/70"
                  style={{ height: `${Math.max(8, (point.value / max) * 60)}px` }}
                  title={`Block ${point.label}: ${point.value}${suffix}`}
                />
              </div>
              {(idx === 0 || idx === displayPoints.length - 1 || idx === Math.floor(displayPoints.length / 2)) ? (
                <p className="mt-2 text-center text-[10px] text-slate-500 truncate">
                  {point.label}
                </p>
              ) : (
                <p className="mt-2 text-center text-[10px] text-transparent">.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
