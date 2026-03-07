export const dynamic = "force-dynamic";

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiAddressDetail } from '@/lib/api-types';
import { formatNumber, formatWeiToQfc } from '@/lib/format';
import CopyButton from '@/components/CopyButton';
import AddressTabs from '@/components/AddressTabs';

const PAGE_SIZE = 25;

export default async function AddressDetailPage({
  params,
  searchParams,
}: {
  params: { address: string };
  searchParams: { page?: string; tab?: string };
}) {
  const address = params.address;
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const tab = searchParams.tab ?? 'transactions';

  const response = await fetchJsonSafe<ApiAddressDetail>(
    `/api/address/${address}?page=${page}&limit=${PAGE_SIZE}&tab=${tab}`,
    { next: { revalidate: 20 } }
  );

  const overview = response?.data.address ?? null;
  const stats = response?.data.stats ?? null;
  const analysis = response?.data.analysis ?? null;
  const contract = response?.data.contract ?? null;
  const transactions = response?.data.transactions ?? [];
  const tokenTransfers = response?.data.tokenTransfers ?? [];

  if (!overview) {
    return (
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-12">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
          <p className="text-lg text-white">Address not found</p>
          <p className="mt-2 text-sm text-slate-400 font-mono break-all">{address}</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const isContract = contract != null;
  const totalTxs = stats ? Number(stats.sent) + Number(stats.received) : 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold text-white">
          {isContract ? 'Contract' : 'Address'}
        </h1>
        {isContract && contract.is_verified && (
          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
            Verified
          </span>
        )}
        <span className="font-mono text-sm text-slate-400 break-all">{address}</span>
        <CopyButton value={address} label="Copy" />
      </div>

      {/* Overview cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewCard label="Balance" value={`${formatWeiToQfc(overview.balance)} QFC`} />
        <OverviewCard label="Nonce" value={formatNumber(overview.nonce)} />
        <OverviewCard
          label="Transactions"
          value={stats ? `${formatNumber(totalTxs)}` : '—'}
          sub={stats ? `${stats.sent} sent / ${stats.received} received` : undefined}
        />
        <OverviewCard label="Last Active" value={`Block ${formatNumber(overview.last_seen_block)}`} />
      </div>

      {/* Value summary */}
      {analysis && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <OverviewCard label="Total Sent" value={`${formatWeiToQfc(analysis.sent_value)} QFC`} />
          <OverviewCard label="Total Received" value={`${formatWeiToQfc(analysis.received_value)} QFC`} />
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8">
        <AddressTabs
          address={address}
          transactions={transactions}
          tokenTransfers={tokenTransfers}
          contract={contract}
          currentTab={tab}
          page={page}
          txCount={stats ? String(Number(stats.sent) + Number(stats.received)) : '0'}
          tokenTransferCount="0"
        />
      </div>
    </main>
  );
}

function OverviewCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1.5 text-sm font-medium text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
