'use client';

import { useEffect, useState } from 'react';
import { apiUrl } from '@/lib/client-api';
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
    let cancelled = false;
    let source: EventSource | null = null;

    // Preflight: check if the stream endpoint exists before opening EventSource
    const url = apiUrl('/api/stream');
    fetch(url, { method: 'HEAD' }).then((res) => {
      if (cancelled || !res.ok) return;
      source = new EventSource(url);
      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setStats(data);
        } catch {
          // ignore
        }
      };
      source.onerror = () => {
        source?.close();
        source = null;
      };
    }).catch(() => {
      // endpoint not available, silently skip
    });

    return () => {
      cancelled = true;
      source?.close();
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
        label="Total Addresses"
        value={stats.active_addresses == null ? '—' : formatNumber(stats.active_addresses)}
      />
    </section>
  );
}
