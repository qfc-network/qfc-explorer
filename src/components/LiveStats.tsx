'use client';

import { useEffect, useState } from 'react';
import StatsCard from '@/components/StatsCard';
import { formatNumber, formatTimestampMs } from '@/lib/format';

export default function LiveStats() {
  const [stats, setStats] = useState<{
    latest_block: string | null;
    latest_timestamp_ms: string | null;
    avg_block_time_ms: string | null;
    tps: string | null;
    active_addresses: string | null;
  } | null>(null);

  useEffect(() => {
    const source = new EventSource('/api/stream');
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStats(data);
      } catch {
        // ignore
      }
    };

    return () => {
      source.close();
    };
  }, []);

  if (!stats) {
    return null;
  }

  const latestHeight = stats.latest_block ?? '0';
  const latestTimestamp = stats.latest_timestamp_ms ?? '0';

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <StatsCard label="Latest Block" value={formatNumber(latestHeight)} />
      <StatsCard
        label="Latest Timestamp"
        value={latestTimestamp !== '0' ? formatTimestampMs(latestTimestamp) : '—'}
      />
      <StatsCard
        label="Active Addresses"
        value={stats.active_addresses == null ? '—' : formatNumber(stats.active_addresses)}
      />
    </section>
  );
}
