export const dynamic = "force-dynamic";

import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiBlocksList, ApiStats, ApiTransactionsList } from '@/lib/api-types';
import { formatNumber } from '@/lib/format';
import AutoRefresh from '@/components/AutoRefresh';
import LatestBlocksAndTxs from '@/components/LatestBlocksAndTxs';
import HomeHero from '@/components/HomeHero';
import HomeStats from '@/components/HomeStats';
import HomeCharts from '@/components/HomeCharts';
import { resolveAddressLabels } from '@/lib/labels';

export default async function Home() {
  const [blocksResponse, transactionsResponse, statsResponse] = await Promise.all([
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

  const fmtTps = tps == null ? '—' : Number(tps) < 0.01 ? Number(tps).toFixed(4) : Number(tps).toFixed(2);
  const fmtBlockTime = avgBlockTimeMs == null ? '—' : `${(Number(avgBlockTimeMs) / 1000).toFixed(1)}s`;

  const statItems = [
    { icon: 'block', labelKey: 'stats.blockHeight' as const, value: formatNumber(latestHeight) },
    { icon: 'clock', labelKey: 'stats.blockTime' as const, value: fmtBlockTime },
    { icon: 'zap', labelKey: 'stats.tps' as const, value: fmtTps },
    { icon: 'users', labelKey: 'stats.addresses' as const, value: activeAddresses == null ? '—' : formatNumber(activeAddresses) },
    { icon: 'chain', labelKey: 'stats.chainId' as const, value: '9000' },
    { icon: 'shield', labelKey: 'stats.finality' as const, value: 'PoC' },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4">
      <AutoRefresh intervalMs={12000} />

      {/* Hero section with search */}
      <HomeHero />

      {/* Network overview stats */}
      <HomeStats stats={statItems} />

      {/* Mini charts */}
      {series ? <HomeCharts series={series} /> : null}

      {/* Latest Blocks + Latest Transactions (dual column) */}
      <section className="mt-8">
        <LatestBlocksAndTxs blocks={blocks} transactions={transactions} labels={labels} />
      </section>
    </main>
  );
}
