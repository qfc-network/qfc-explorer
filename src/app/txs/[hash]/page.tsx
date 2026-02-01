import Link from 'next/link';
import { getTransactionByHash } from '@/db/queries';
import { formatNumber, shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';

export default async function TransactionDetailPage({
  params,
}: {
  params: { hash: string };
}) {
  const hash = params.hash;
  const tx = await getTransactionByHash(hash);

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
          <Link
            href="/txs"
            className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
          >
            Back
          </Link>
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
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
          <p className="mt-2 text-lg text-white">{tx.status}</p>
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
          <p className="mt-2 text-lg text-white">{tx.value}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Gas</p>
          <p className="mt-2 text-lg text-white">{formatNumber(tx.gas_limit)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Input Data</p>
        <p className="mt-3 break-all font-mono text-xs">{tx.data ?? '0x'}</p>
      </div>
    </main>
  );
}
