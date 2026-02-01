export const dynamic = "force-dynamic";

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiTransactionDetail } from '@/lib/api-types';
import { formatNumber, formatWeiToQfc, shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import CopyButton from '@/components/CopyButton';
import StatusBadge from '@/components/StatusBadge';

export default async function TransactionDetailPage({
  params,
}: {
  params: { hash: string };
}) {
  const hash = params.hash;
  const response = await fetchJsonSafe<ApiTransactionDetail>(
    `/api/txs/${hash}`,
    { next: { revalidate: 10 } }
  );

  const tx = response?.data.transaction ?? null;
  const logs = response?.data.logs ?? [];

  if (!tx) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-12">
        <SectionHeader title="Transaction not found" description={hash} />
        <Link
          href="/txs"
          className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
        >
          Back to transactions
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <SectionHeader
        title="Transaction"
        description={shortenHash(tx.hash)}
        action={
          <div className="flex items-center gap-3">
            <CopyButton value={tx.hash} label="Copy hash" />
            <Link
              href="/txs"
              className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
            >
              Back
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Block Height</p>
          <Link href={`/blocks/${tx.block_height}`} className="mt-2 block text-lg text-white">
            {formatNumber(tx.block_height)}
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Nonce</p>
          <p className="mt-2 text-lg text-white">{formatNumber(tx.nonce)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
          <div className="mt-2">
            <StatusBadge status={tx.status} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">From</p>
          <Link href={`/address/${tx.from_address}`} className="mt-2 block text-lg text-white">
            {shortenHash(tx.from_address)}
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">To</p>
          <p className="mt-2 text-lg text-white">
            {tx.to_address ? (
              <Link href={`/address/${tx.to_address}`}>{shortenHash(tx.to_address)}</Link>
            ) : (
              '—'
            )}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Value</p>
          <p className="mt-2 text-lg text-white">{formatWeiToQfc(tx.value)} QFC</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Gas Price</p>
          <p className="mt-2 text-lg text-white">{tx.gas_price}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Gas</p>
          <p className="mt-2 text-lg text-white">{formatNumber(tx.gas_limit)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Input Data</p>
        <div className="mt-3 flex items-start gap-2">
          <p className="break-all font-mono text-xs">{tx.data ?? '0x'}</p>
          {tx.data ? <CopyButton value={tx.data} label="Copy" /> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Logs</p>
        {logs.length === 0 ? (
          <p className="mt-3 text-slate-400">No logs.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {logs.map((log, index) => (
              <div key={`${log.contract_address}-${index}`} className="rounded-xl border border-slate-800 p-3">
                <p className="text-xs text-slate-400">Contract: {log.contract_address}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Topics: {[log.topic0, log.topic1, log.topic2, log.topic3].filter(Boolean).join(', ') || '—'}
                </p>
                <p className="mt-2 break-all font-mono text-xs">{log.data ?? '0x'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
