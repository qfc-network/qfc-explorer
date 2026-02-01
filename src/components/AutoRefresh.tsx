'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

type AutoRefreshProps = {
  intervalMs?: number;
};

export default function AutoRefresh({ intervalMs = 15000 }: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const handle = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(handle);
  }, [intervalMs, router]);

  return null;
}
