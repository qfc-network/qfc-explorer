'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  intervalMs?: number;
  currentSort: string;
  currentOrder: string;
};

export default function PendingRefresh({ intervalMs = 10000, currentSort, currentOrder }: Props) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(Math.floor(intervalMs / 1000));

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      router.refresh();
      setSecondsLeft(Math.floor(intervalMs / 1000));
    }, intervalMs);

    const countdownInterval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : Math.floor(intervalMs / 1000)));
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, [intervalMs, router, currentSort, currentOrder]);

  return (
    <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <span>Auto-refresh in {secondsLeft}s</span>
    </div>
  );
}
