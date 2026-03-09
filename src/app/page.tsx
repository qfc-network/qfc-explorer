export const dynamic = "force-dynamic";

import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiBlocksList, ApiStats, ApiTransactionsList } from '@/lib/api-types';
import { formatNumber } from '@/lib/format';
import nextDynamic from 'next/dynamic';
import HomeHero from '@/components/HomeHero';
import HomeStats from '@/components/HomeStats';
import HomeCharts from '@/components/HomeCharts';
import LatestBlocksAndTxs from '@/components/LatestBlocksAndTxs';
import ErrorBoundary from '@/components/ErrorBoundary';
import { resolveAddressLabels } from '@/lib/labels';

const GasTracker = nextDynamic(() => import('@/components/GasTracker'), { ssr: false });
const HomeLiveUpdater = nextDynamic(() => import('@/components/HomeLiveUpdater'), { ssr: false });

export default async function Home() {
  const [blocksResponse, transactionsResponse, statsResponse, networkResponse] = await Promise.all([
    fetchJsonSafe<ApiBlocksList>(
      '/api/blocks?limit=8&page=1',
      { next: { revalidate: 5 } }
    ),
    fetchJsonSafe<ApiTransactionsList>(
      '/api/transactions?limit=8&page=1',
      { next: { revalidate: 5 } }
    ),
    fetchJsonSafe<ApiStats>(
      '/api/stats',
      { next: { revalidate: 10 } }
    ),
    fetchJsonSafe<{ data: { validators?: unknown[]; nodeInfo?: { peerCount?: number } } }>(
      '/api/network',
      { next: { revalidate: 30 } }
    ),
  ]);
  const blocks = blocksResponse?.data.items ?? [];
  const transactions = transactionsResponse?.data.items ?? [];

  // Resolve address labels for homepage
  const homeAddresses = [
    ...blocks.map((b) => b.producer).filter(Boolean) as string[],
    ...transactions.flatMap((tx) => [tx.from_address, tx.to_address].filter(Boolean) as string[]),
  ];
  const labels = await resolveAddressLabels(homeAddresses);

  const latestHeight = statsResponse?.data.stats.latest_block ?? blocks[0]?.height ?? '0';
  const avgBlockTimeMs = statsResponse?.data.stats.avg_block_time_ms;
  const tps = statsResponse?.data.stats.tps;
  const activeAddresses = statsResponse?.data.stats.active_addresses;
  const series = statsResponse?.data.series;
  const validatorCount = networkResponse?.data.validators?.length ?? 0;
  const peerCount = networkResponse?.data.nodeInfo?.peerCount ?? 0;

  const fmtTps = tps == null ? '—' : Number(tps) < 0.01 ? Number(tps).toFixed(4) : Number(tps).toFixed(2);
  const fmtBlockTime = avgBlockTimeMs == null ? '—' : `${(Number(avgBlockTimeMs) / 1000).toFixed(1)}s`;

  // Show validators if no active addresses yet (early testnet)
  const addressValue = Number(activeAddresses) > 0
    ? formatNumber(activeAddresses!)
    : validatorCount > 0
      ? `${validatorCount} validators`
      : '—';

  const statItems = [
    { icon: 'block', labelKey: 'stats.blockHeight' as const, value: formatNumber(latestHeight) },
    { icon: 'clock', labelKey: 'stats.blockTime' as const, value: fmtBlockTime },
    { icon: 'zap', labelKey: 'stats.tps' as const, value: fmtTps },
    { icon: 'users', labelKey: 'stats.addresses' as const, value: addressValue },
    { icon: 'chain', labelKey: 'stats.chainId' as const, value: '9000' },
    { icon: 'shield', labelKey: 'stats.finality' as const, value: `${peerCount + 1} peers` },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4">
      {/* Hero section with search */}
      <HomeHero />

      {/* SSE-powered live stats + blocks/txs — falls back to SSR data */}
      <ErrorBoundary>
        <HomeLiveUpdater
          initialBlocks={blocks}
          initialTransactions={transactions}
          initialStats={statItems}
          initialLabels={labels}
        />
      </ErrorBoundary>

      {/* Gas price oracle widget */}
      <ErrorBoundary>
        <GasTracker />
      </ErrorBoundary>

      {/* Mini charts */}
      <ErrorBoundary>
        {series ? <HomeCharts series={series} /> : null}
      </ErrorBoundary>

      {/* SSR fallback: stats + blocks/txs shown until client hydrates */}
      <noscript>
        <HomeStats stats={statItems} />
        <section className="mt-8">
          <LatestBlocksAndTxs blocks={blocks} transactions={transactions} labels={labels} />
        </section>
      </noscript>
    </main>
  );
}
