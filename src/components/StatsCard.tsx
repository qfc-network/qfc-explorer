import type { ReactNode } from 'react';

type StatsCardProps = {
  label: ReactNode;
  value: string;
  sub?: string;
  suffix?: string;
  highlight?: boolean;
};

export default function StatsCard({ label, value, sub, suffix, highlight }: StatsCardProps) {
  return (
    <div
      className={`rounded-2xl border p-5 min-h-[104px] ${
        highlight
          ? 'border-green-500/30 bg-green-500/10'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60'
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 h-4">{label}</p>
      <p className={`mt-2 text-2xl font-semibold h-8 ${highlight ? 'text-green-400' : 'text-slate-900 dark:text-white'}`}>
        {value}
        {suffix && <span className="text-lg text-slate-400">{suffix}</span>}
      </p>
      {sub ? <p className="mt-1 text-xs text-slate-400">{sub}</p> : null}
    </div>
  );
}
