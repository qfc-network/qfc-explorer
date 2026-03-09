export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import { formatNumber, formatWeiToQfc } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import Table from '@/components/Table';
import AutoRefresh from '@/components/AutoRefresh';
import { getApiBaseUrl } from '@/lib/api-client';

export const metadata: Metadata = {
  title: 'Bridge',
  description: 'QFC bridge status — TVL, validators, pending deposits and withdrawals.',
  openGraph: {
    title: 'Bridge | QFC Explorer',
    description: 'QFC bridge status — TVL, validators, pending deposits and withdrawals.',
    type: 'website',
  },
};

type BridgeStatus = {
  validators: number;
  tvl: string;
  pendingDeposits: BridgeOp[];
  pendingWithdrawals: BridgeOp[];
  active: boolean;
};

type BridgeOp = {
  id: string;
  from: string;
  to: string;
  amount: string;
  status: 'Pending' | 'Confirmed' | 'Completed';
  timestamp: string;
  txHash?: string;
};

async function rpcCall<T>(method: string, params: unknown[] = []): Promise<T | null> {
  try {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/api/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
      next: { revalidate: 15 },
    });
    const json = await res.json();
    if (!json.ok) return null;
    return json.data as T;
  } catch {
    return null;
  }
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    Confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
      {status}
    </span>
  );
}

function shortenAddr(addr: string) {
  if (!addr || addr.length <= 14) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

const opColumns = [
  {
    key: 'id',
    header: 'ID',
    render: (row: BridgeOp) => <span className="font-mono text-xs">{row.id}</span>,
  },
  {
    key: 'from',
    header: 'From',
    render: (row: BridgeOp) => <span className="font-mono text-xs">{shortenAddr(row.from)}</span>,
  },
  {
    key: 'to',
    header: 'To',
    render: (row: BridgeOp) => <span className="font-mono text-xs">{shortenAddr(row.to)}</span>,
  },
  {
    key: 'amount',
    header: 'Amount',
    render: (row: BridgeOp) => <span>{formatWeiToQfc(row.amount)} QFC</span>,
  },
  {
    key: 'status',
    header: 'Status',
    render: (row: BridgeOp) => <StatusBadge status={row.status} />,
  },
  {
    key: 'timestamp',
    header: 'Time',
    render: (row: BridgeOp) => {
      const ms = Number(row.timestamp) * 1000;
      if (!Number.isFinite(ms) || ms === 0) return '--';
      return new Date(ms).toLocaleString('en-US', { hour12: false });
    },
  },
];

export default async function BridgePage() {
  const status = await rpcCall<BridgeStatus>('qfc_getBridgeStatus');

  const deposits = status?.pendingDeposits ?? [];
  const withdrawals = status?.pendingWithdrawals ?? [];

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      <AutoRefresh intervalMs={15000} />
      <SectionHeader
        title="Bridge"
        description="Cross-chain bridge status, pending deposits and withdrawals."
      />

      {/* Status cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Status"
          value={status ? (status.active ? 'Active' : 'Paused') : '--'}
          highlight={status?.active === true}
        />
        <StatsCard
          label="Total Value Locked"
          value={status ? formatWeiToQfc(status.tvl) : '--'}
          suffix=" QFC"
        />
        <StatsCard
          label="Validators"
          value={status ? formatNumber(status.validators) : '--'}
        />
        <StatsCard
          label="Pending Ops"
          value={status ? formatNumber(deposits.length + withdrawals.length) : '--'}
        />
      </section>

      {/* Pending Deposits */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
          Pending Deposits ({formatNumber(deposits.length)})
        </h2>
        <Table<BridgeOp>
          rows={deposits}
          keyField="id"
          emptyMessage="No pending deposits."
          columns={opColumns}
        />
      </section>

      {/* Pending Withdrawals */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
          Pending Withdrawals ({formatNumber(withdrawals.length)})
        </h2>
        <Table<BridgeOp>
          rows={withdrawals}
          keyField="id"
          emptyMessage="No pending withdrawals."
          columns={opColumns}
        />
      </section>
    </main>
  );
}
