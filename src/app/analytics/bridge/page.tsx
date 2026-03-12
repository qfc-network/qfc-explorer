export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bridge Analytics',
  description: 'QFC cross-chain bridge flow, volume, and relayer stats.',
  openGraph: {
    title: 'Bridge Analytics | QFC Explorer',
    description: 'QFC cross-chain bridge flow, volume, and relayer stats.',
    type: 'website',
  },
};

import Link from 'next/link';
import dynamic_import from 'next/dynamic';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import Table from '@/components/Table';
import { shortenHash } from '@/lib/format';

const BridgeCharts = dynamic_import(
  () => import('@/components/BridgeCharts'),
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

// Mock data
const MOCK_STATS = {
  totalVolume: '$8,420,000',
  volume24h: '$312,500',
  totalTxs: '5,842',
  avgBridgeTime: '4.2 min',
};

type ChainFlowRow = {
  route: string;
  volume: string;
  txCount: number;
  share: string;
};

const MOCK_CHAIN_FLOWS: ChainFlowRow[] = [
  { route: 'QFC → ETH',  volume: '$3,240,000', txCount: 2104, share: '38.5%' },
  { route: 'ETH → QFC',  volume: '$2,890,000', txCount: 1876, share: '34.3%' },
  { route: 'QFC → BSC',  volume: '$1,280,000', txCount: 1012, share: '15.2%' },
  { route: 'BSC → QFC',  volume: '$1,010,000', txCount: 850,  share: '12.0%' },
];

type TokenVolumeRow = {
  token: string;
  volume: string;
  txCount: number;
  avgSize: string;
};

const MOCK_TOKEN_VOLUMES: TokenVolumeRow[] = [
  { token: 'QFC',  volume: '$4,120,000', txCount: 3210, avgSize: '$1,283' },
  { token: 'USDT', volume: '$2,340,000', txCount: 1420, avgSize: '$1,648' },
  { token: 'USDC', volume: '$1,560,000', txCount: 890,  avgSize: '$1,752' },
  { token: 'TTK',  volume: '$400,000',   txCount: 322,  avgSize: '$1,242' },
];

type RelayerRow = {
  address: string;
  txsRelayed: number;
  uptime: string;
  avgRelayTime: string;
};

const MOCK_RELAYERS: RelayerRow[] = [
  { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18', txsRelayed: 3420, uptime: '99.8%', avgRelayTime: '3.1 min' },
  { address: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0', txsRelayed: 2422, uptime: '99.5%', avgRelayTime: '4.8 min' },
];

export default function BridgeAnalyticsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader
          title="Bridge Analytics"
          description="Cross-chain bridge flow, volume, and relayer performance."
        />
        <div className="flex gap-2">
          <Link
            href="/analytics"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Overview
          </Link>
          <Link
            href="/bridge"
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500"
          >
            Bridge
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Volume" value={MOCK_STATS.totalVolume} />
        <StatsCard label="Volume (24h)" value={MOCK_STATS.volume24h} />
        <StatsCard label="Total Transactions" value={MOCK_STATS.totalTxs} />
        <StatsCard label="Avg Bridge Time" value={MOCK_STATS.avgBridgeTime} sub="Median confirmation" />
      </section>

      {/* Charts */}
      <section className="mt-8">
        <BridgeCharts />
      </section>

      {/* Volume by Chain */}
      <section className="mt-8 space-y-4">
        <SectionHeader
          title="Volume by Route"
          description="Bridge flow between chains"
        />
        <Table
          rows={MOCK_CHAIN_FLOWS}
          keyField="route"
          emptyMessage="No bridge routes."
          columns={[
            { key: 'route', header: 'Route', render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.route}</span> },
            { key: 'volume', header: 'Volume', render: (row) => row.volume },
            { key: 'txCount', header: 'Transactions', render: (row) => row.txCount.toLocaleString() },
            { key: 'share', header: 'Share', render: (row) => row.share },
          ]}
        />
      </section>

      {/* Volume by Token */}
      <section className="mt-8 space-y-4">
        <SectionHeader
          title="Volume by Token"
          description="Bridge volume per token"
        />
        <Table
          rows={MOCK_TOKEN_VOLUMES}
          keyField="token"
          emptyMessage="No token data."
          columns={[
            { key: 'token', header: 'Token', render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.token}</span> },
            { key: 'volume', header: 'Volume', render: (row) => row.volume },
            { key: 'txCount', header: 'Transactions', render: (row) => row.txCount.toLocaleString() },
            { key: 'avgSize', header: 'Avg Size', render: (row) => row.avgSize },
          ]}
        />
      </section>

      {/* Relayer Stats */}
      <section className="mt-8 space-y-4">
        <SectionHeader
          title="Relayer Performance"
          description="Bridge relayer uptime and throughput"
        />
        <Table
          rows={MOCK_RELAYERS}
          keyField="address"
          emptyMessage="No relayers."
          columns={[
            {
              key: 'address',
              header: 'Relayer',
              render: (row) => (
                <Link href={`/address/${row.address}`} className="font-mono text-sm text-cyan-400 hover:text-cyan-300">
                  {shortenHash(row.address)}
                </Link>
              ),
            },
            { key: 'txsRelayed', header: 'Txs Relayed', render: (row) => row.txsRelayed.toLocaleString() },
            {
              key: 'uptime',
              header: 'Uptime',
              render: (row) => <span className="text-emerald-400">{row.uptime}</span>,
            },
            { key: 'avgRelayTime', header: 'Avg Relay Time', render: (row) => row.avgRelayTime },
          ]}
        />
      </section>
    </main>
  );
}
