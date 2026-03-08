'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSSE } from '@/lib/use-sse';
import { getApiBaseUrl } from '@/lib/api-client';
import LiveIndicator from '@/components/LiveIndicator';
import LatestBlocksAndTxs from '@/components/LatestBlocksAndTxs';
import HomeStats from '@/components/HomeStats';
import { formatNumber } from '@/lib/format';
import type { ApiBlocksList, ApiTransactionsList, ApiStats } from '@/lib/api-types';
import type { TranslationKey } from '@/lib/translations/en';

type Block = {
  height: string;
  hash: string;
  producer: string | null;
  tx_count: string | number;
  timestamp_ms: string;
};

type Transaction = {
  hash: string;
  from_address: string;
  to_address: string | null;
  value: string;
  block_height: string;
  timestamp_ms?: string;
};

type LabelMap = Record<string, { label: string; category: string | null }>;

type StatItem = {
  icon: string;
  labelKey: TranslationKey;
  value: string;
};

type Props = {
  initialBlocks: Block[];
  initialTransactions: Transaction[];
  initialStats: StatItem[];
  initialLabels: LabelMap;
};

/**
 * Client component that uses SSE to update homepage data in real time.
 * Falls back to the server-rendered initial data until SSE pushes updates.
 */
export default function HomeLiveUpdater({
  initialBlocks,
  initialTransactions,
  initialStats,
  initialLabels,
}: Props) {
  const { data: sseData, connected } = useSSE(['message']);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [stats, setStats] = useState<StatItem[]>(initialStats);
  const [labels] = useState<LabelMap>(initialLabels);

  // Fetch fresh blocks/txs when SSE notifies us of new data
  const fetchLatest = useCallback(async () => {
    const base = getApiBaseUrl();
    const isExternalApi =
      base.includes(':3001') ||
      (process.env.NEXT_PUBLIC_API_URL ?? '').length > 0;
    const prefix = isExternalApi ? '' : '/api';

    try {
      const [blocksRes, txsRes] = await Promise.all([
        fetch(`${base}${prefix}/blocks?limit=8&page=1`),
        fetch(`${base}${prefix}/transactions?limit=8&page=1`),
      ]);

      if (blocksRes.ok) {
        const bJson = (await blocksRes.json()) as ApiBlocksList;
        if (bJson.ok) {
          setBlocks(bJson.data.items as unknown as Block[]);
        }
      }
      if (txsRes.ok) {
        const tJson = (await txsRes.json()) as ApiTransactionsList;
        if (tJson.ok) {
          setTransactions(tJson.data.items as unknown as Transaction[]);
        }
      }
    } catch {
      // silently ignore — we still have the previous data
    }
  }, []);

  // When SSE pushes new stats, update the stat cards and fetch fresh lists
  useEffect(() => {
    const msg = sseData.message as Record<string, string | null> | undefined;
    if (!msg) return;

    const latestHeight = msg.latest_block ?? '0';
    const avgBlockTimeMs = msg.avg_block_time_ms;
    const tps = msg.tps;
    const activeAddresses = msg.active_addresses;

    const fmtTps =
      tps == null ? '—' : Number(tps) < 0.01 ? Number(tps).toFixed(4) : Number(tps).toFixed(2);
    const fmtBlockTime =
      avgBlockTimeMs == null ? '—' : `${(Number(avgBlockTimeMs) / 1000).toFixed(1)}s`;

    setStats([
      { icon: 'block', labelKey: 'stats.blockHeight' as const, value: formatNumber(latestHeight) },
      { icon: 'clock', labelKey: 'stats.blockTime' as const, value: fmtBlockTime },
      { icon: 'zap', labelKey: 'stats.tps' as const, value: fmtTps },
      {
        icon: 'users',
        labelKey: 'stats.addresses' as const,
        value: activeAddresses == null ? '—' : formatNumber(activeAddresses),
      },
      { icon: 'chain', labelKey: 'stats.chainId' as const, value: '9000' },
      { icon: 'shield', labelKey: 'stats.finality' as const, value: 'PoC' },
    ]);

    // Also refresh the blocks/txs lists
    fetchLatest();
  }, [sseData.message, fetchLatest]);

  return (
    <>
      {/* Stats with live indicator */}
      <HomeStats stats={stats} />

      {/* Latest blocks & txs with live badge */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <LiveIndicator connected={connected} />
        </div>
        <LatestBlocksAndTxs blocks={blocks} transactions={transactions} labels={labels} />
      </section>
    </>
  );
}
