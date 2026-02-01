const statusStyles: Record<string, string> = {
  success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  failure: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  unknown: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
};

type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status?.toLowerCase() ?? 'unknown';
  const className = statusStyles[normalized] ?? statusStyles.unknown;
  const label = normalized === 'success' ? 'Success' : normalized === 'failure' ? 'Failed' : 'Unknown';

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${className}`}>
      {label}
    </span>
  );
}
