export const dynamic = "force-dynamic";

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiMinerDetail } from '@/lib/api-types';
import { formatNumber, shortenHash, formatTimestampMs } from '@/lib/format';
import { formatHexWeiToQfc, formatFlops } from '@/lib/qfc-format';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import CopyButton from '@/components/CopyButton';

export default async function MinerDetailPage({
  params,
}: {
  params: { address: string };
}) {
  const { address } = params;
  const response = await fetchJsonSafe<ApiMinerDetail>(
    `/api/miner/${address}`,
    { next: { revalidate: 15 } }
  );

  const miner = response?.data ?? null;

  if (!miner) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-12">
        <SectionHeader title="Miner not found" description={`Address ${address}`} />
        <Link
          href="/"
          className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
        >
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <SectionHeader
        title={`Miner ${shortenHash(miner.address)}`}
        description={`Contribution score: ${miner.contributionScore}`}
        action={
          <div className="flex items-center gap-3">
            <CopyButton value={miner.address} label="Copy address" />
            <Link
              href={`/address/${miner.address}`}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
            >
              View account
            </Link>
          </div>
        }
      />

      {/* Revenue summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Earned</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {formatHexWeiToQfc(miner.totalEarned)} QFC
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Available Balance</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {formatHexWeiToQfc(miner.available)} QFC
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Locked (Vesting)</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {formatHexWeiToQfc(miner.locked)} QFC
          </p>
        </div>
      </div>

      {/* Vesting schedule */}
      <section className="space-y-4">
        <SectionHeader
          title="Vesting Schedule"
          description={`${miner.activeTranches} active tranche${miner.activeTranches === 1 ? '' : 's'}`}
        />
        <Table
          rows={miner.tranches}
          emptyMessage="No vesting tranches."
          columns={[
            {
              key: 'blockHeight',
              header: 'Block',
              render: (row) => (
                <Link href={`/blocks/${row.blockHeight}`} className="text-slate-200">
                  {formatNumber(row.blockHeight)}
                </Link>
              ),
            },
            {
              key: 'amount',
              header: 'Amount',
              render: (row) => `${formatHexWeiToQfc(row.amount)} QFC`,
            },
            {
              key: 'vested',
              header: 'Vested',
              render: (row) => `${formatHexWeiToQfc(row.vested)} QFC`,
            },
            {
              key: 'progress',
              header: 'Progress',
              render: (row) => (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, row.percentVested)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{row.percentVested}%</span>
                </div>
              ),
            },
            {
              key: 'cliffEnd',
              header: 'Cliff End',
              render: (row) => formatTimestampMs(row.cliffEnd),
            },
            {
              key: 'endTime',
              header: 'End Time',
              render: (row) => formatTimestampMs(row.endTime),
            },
          ]}
        />
      </section>

      {/* Recent earnings */}
      <section className="space-y-4">
        <SectionHeader title="Recent Earnings" />
        <Table
          rows={miner.earnings}
          emptyMessage="No earnings recorded yet."
          columns={[
            {
              key: 'blockHeight',
              header: 'Block',
              render: (row) => (
                <Link href={`/blocks/${row.blockHeight}`} className="text-slate-200">
                  {formatNumber(row.blockHeight)}
                </Link>
              ),
            },
            {
              key: 'reward',
              header: 'Reward',
              render: (row) => `${formatHexWeiToQfc(row.reward)} QFC`,
            },
            {
              key: 'taskType',
              header: 'Task Type',
              render: (row) => (
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                  {row.taskType}
                </span>
              ),
            },
            {
              key: 'flops',
              header: 'FLOPS',
              render: (row) => formatFlops(row.flops),
            },
            {
              key: 'timestamp',
              header: 'Time',
              render: (row) => formatTimestampMs(row.timestamp),
            },
          ]}
        />
      </section>
    </main>
  );
}
