export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DeFi Analytics',
  description: 'QFC DeFi protocol TVL, lending, staking, and yield analytics.',
  openGraph: {
    title: 'DeFi Analytics | QFC Explorer',
    description: 'QFC DeFi protocol TVL, lending, staking, and yield analytics.',
    type: 'website',
  },
};

import Link from 'next/link';
import dynamic_import from 'next/dynamic';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import Table from '@/components/Table';

const DefiCharts = dynamic_import(
  () => import('@/components/DefiCharts'),
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

// Mock data — will be replaced with /api/analytics/defi
const MOCK_STATS = {
  totalTvl: '$12,480,500',
  qusdSupply: '2,140,000 QUSD',
  stakingRatio: '34.2%',
  totalUsers: '1,842',
};

type ProtocolRow = {
  name: string;
  tvl: string;
  change24h: string;
  changePositive: boolean;
  activeUsers: number;
  totalTxs: number;
};

const MOCK_PROTOCOLS: ProtocolRow[] = [
  { name: 'QUSD CDP',      tvl: '$4,280,000',  change24h: '+2.4%',  changePositive: true,  activeUsers: 312,  totalTxs: 8420 },
  { name: 'Lending Pool',  tvl: '$3,150,000',  change24h: '+1.1%',  changePositive: true,  activeUsers: 245,  totalTxs: 12340 },
  { name: 'stQFC Staking', tvl: '$2,840,000',  change24h: '-0.3%',  changePositive: false, activeUsers: 520,  totalTxs: 4280 },
  { name: 'Yield Vaults',  tvl: '$1,620,500',  change24h: '+3.8%',  changePositive: true,  activeUsers: 187,  totalTxs: 3150 },
  { name: 'Launchpad',     tvl: '$590,000',    change24h: '+12.5%', changePositive: true,  activeUsers: 78,   totalTxs: 920 },
];

type LendingRow = {
  asset: string;
  supplied: string;
  borrowed: string;
  utilization: string;
  supplyAPY: string;
  borrowAPY: string;
};

const MOCK_LENDING: LendingRow[] = [
  { asset: 'QFC',  supplied: '$2,100,000', borrowed: '$1,260,000', utilization: '60%',  supplyAPY: '4.2%', borrowAPY: '6.8%' },
  { asset: 'QUSD', supplied: '$850,000',   borrowed: '$680,000',   utilization: '80%',  supplyAPY: '8.1%', borrowAPY: '12.4%' },
  { asset: 'TTK',  supplied: '$200,000',   borrowed: '$40,000',    utilization: '20%',  supplyAPY: '1.5%', borrowAPY: '3.2%' },
];

export default function DefiAnalyticsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader
          title="DeFi Analytics"
          description="Protocol TVL, lending markets, staking, and yield metrics."
        />
        <Link
          href="/analytics"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          Overview
        </Link>
      </div>

      {/* Overview Stats */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total TVL" value={MOCK_STATS.totalTvl} />
        <StatsCard label="QUSD Supply" value={MOCK_STATS.qusdSupply} />
        <StatsCard label="Staking Ratio" value={MOCK_STATS.stakingRatio} sub="% of QFC staked" />
        <StatsCard label="Active Users" value={MOCK_STATS.totalUsers} />
      </section>

      {/* Charts */}
      <section className="mt-8">
        <DefiCharts />
      </section>

      {/* Protocol Breakdown */}
      <section className="mt-8 space-y-4">
        <SectionHeader
          title="Protocol Breakdown"
          description="TVL and activity per DeFi protocol"
        />
        <Table
          rows={MOCK_PROTOCOLS}
          keyField="name"
          emptyMessage="No protocols found."
          columns={[
            { key: 'name', header: 'Protocol', render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.name}</span> },
            { key: 'tvl', header: 'TVL', render: (row) => row.tvl },
            {
              key: 'change24h',
              header: '24h Change',
              render: (row) => (
                <span className={row.changePositive ? 'text-emerald-400' : 'text-red-400'}>
                  {row.change24h}
                </span>
              ),
            },
            { key: 'activeUsers', header: 'Active Users', render: (row) => row.activeUsers.toLocaleString() },
            { key: 'totalTxs', header: 'Total Txs', render: (row) => row.totalTxs.toLocaleString() },
          ]}
        />
      </section>

      {/* Lending Markets */}
      <section className="mt-8 space-y-4">
        <SectionHeader
          title="Lending Markets"
          description="Utilization rates and APY per asset"
        />
        <Table
          rows={MOCK_LENDING}
          keyField="asset"
          emptyMessage="No lending markets."
          columns={[
            { key: 'asset', header: 'Asset', render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.asset}</span> },
            { key: 'supplied', header: 'Supplied', render: (row) => row.supplied },
            { key: 'borrowed', header: 'Borrowed', render: (row) => row.borrowed },
            {
              key: 'utilization',
              header: 'Utilization',
              render: (row) => (
                <span className={`font-mono ${parseFloat(row.utilization) > 70 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {row.utilization}
                </span>
              ),
            },
            { key: 'supplyAPY', header: 'Supply APY', render: (row) => <span className="text-emerald-400">{row.supplyAPY}</span> },
            { key: 'borrowAPY', header: 'Borrow APY', render: (row) => <span className="text-red-400">{row.borrowAPY}</span> },
          ]}
        />
      </section>
    </main>
  );
}
