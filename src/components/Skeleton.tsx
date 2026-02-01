export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-800/60 ${className ?? ''}`.trim()}
    />
  );
}
