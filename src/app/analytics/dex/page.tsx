export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DEX Analytics',
  description: 'QFC DEX trading volume, liquidity, and top pairs.',
  openGraph: {
    title: 'DEX Analytics | QFC Explorer',
    description: 'QFC DEX trading volume, liquidity, and top pairs.',
    type: 'website',
  },
};

import Link from 'next/link';
import dynamic_import from 'next/dynamic';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import Table from '@/components/Table';
import { shortenHash } from '@/lib/format';

const DexCharts = dynamic_import(
  () => import('@/components/DexCharts'),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50" />
        ))}
      </div>
    ),
  }
);

// Mock data — will be replaced with /api/analytics/dex once on-chain DEX indexing is available
const MOCK_STATS = {
  volume24h: '$2,847,320',
  volume7d: '$18,432,100',
  tvl: '$5,612,800',
  totalSwaps: '42,318',
};

type PairRow = {
  pair: string;
  volume24h: string;
  fees24h: string;
  liquidity: string;
  price: string;
};

const MOCK_PAIRS: PairRow[] = [
  { pair: 'QFC / TTK',   volume24h: '$2,014,500', fees24h: '$6,043',  liquidity: '$3,280,000', price: '1.24 TTK' },
  { pair: 'QFC / QDOGE', volume24h: '$832,820',   fees24h: '$2,498',  liquidity: '$1,520,000', price: '15,420 QDOGE' },
  { pair: 'QFC / USDC',  volume24h: '$412,100',   fees24h: '$1,236',  liquidity: '$812,800',   price: '0.85 USDC' },
];

type TraderRow = {
  address: string;
  volume: string;
  swapCount: number;
};

const MOCK_TRADERS: TraderRow[] = [
  { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18', volume: '$1,204,500', swapCount: 312 },
  { address: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0', volume: '$892,100',   swapCount: 187 },
  { address: '0x2932b7A2355D6fecc4b5c0B6BD44cC31df247a2e', volume: '$654,320',   swapCount: 245 },
  { address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72', volume: '$412,800',   swapCount: 98 },
  { address: '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a', volume: '$287,100',   swapCount: 156 },
];

export default function DexAnalyticsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader
          title="DEX Analytics"
          description="Trading volume, liquidity, and pair metrics for QFC DEX."
        />
        <div className="flex gap-2">
          <Link
            href="/analytics"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Overview
          </Link>
          <Link
            href="https://dex.testnet.qfc.network"
            target="_blank"
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500"
          >
            Open DEX
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Volume (24h)" value={MOCK_STATS.volume24h} />
        <StatsCard label="Volume (7d)" value={MOCK_STATS.volume7d} />
        <StatsCard label="Total TVL" value={MOCK_STATS.tvl} />
        <StatsCard label="Total Swaps" value={MOCK_STATS.totalSwaps} />
      </section>

      {/* Charts */}
      <section className="mt-8">
        <DexCharts />
      </section>

      {/* Top Pairs */}
      <section className="mt-8 space-y-4">
        <SectionHeader
          title="Top Trading Pairs"
          description="Ranked by 24h trading volume"
        />
        <Table
          rows={MOCK_PAIRS}
          keyField="pair"
          emptyMessage="No pairs found."
          columns={[
            { key: 'pair', header: 'Pair', render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.pair}</span> },
            { key: 'volume24h', header: 'Volume (24h)', render: (row) => row.volume24h },
            { key: 'fees24h', header: 'Fees (24h)', render: (row) => row.fees24h },
            { key: 'liquidity', header: 'Liquidity', render: (row) => row.liquidity },
            { key: 'price', header: 'Price', render: (row) => row.price },
          ]}
        />
      </section>

      {/* Top Traders */}
      <section className="mt-8 space-y-4">
        <SectionHeader
          title="Top Traders"
          description="Ranked by total volume"
        />
        <Table
          rows={MOCK_TRADERS}
          keyField="address"
          emptyMessage="No traders found."
          columns={[
            {
              key: 'rank',
              header: '#',
              render: (_row, idx) => <span className="text-slate-500">{(idx ?? 0) + 1}</span>,
            },
            {
              key: 'address',
              header: 'Address',
              render: (row) => (
                <Link href={`/address/${row.address}`} className="font-mono text-sm text-cyan-400 hover:text-cyan-300">
                  {shortenHash(row.address)}
                </Link>
              ),
            },
            { key: 'volume', header: 'Volume', render: (row) => row.volume },
            { key: 'swapCount', header: 'Swaps', render: (row) => row.swapCount.toLocaleString() },
          ]}
        />
      </section>
    </main>
  );
}
