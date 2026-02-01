import Link from 'next/link';
import { getAddressOverview, getBlockByHash, getBlockByHeight, getTransactionByHash } from '@/db/queries';
import SectionHeader from '@/components/SectionHeader';
import { shortenHash } from '@/lib/format';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = (searchParams.q ?? '').trim();
  if (!query) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-12">
        <SectionHeader title="Search" description="Enter a block height, hash, or address." />
      </main>
    );
  }

  const isNumeric = /^\d+$/.test(query);
  const isHex = /^0x[0-9a-fA-F]+$/.test(query);

  const [blockByHeight, blockByHash, txByHash, address] = await Promise.all([
    isNumeric ? getBlockByHeight(query) : Promise.resolve(null),
    isHex ? getBlockByHash(query) : Promise.resolve(null),
    isHex ? getTransactionByHash(query) : Promise.resolve(null),
    isHex && query.length === 42 ? getAddressOverview(query) : Promise.resolve(null),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-12">
      <SectionHeader title="Search results" description={`Query: ${query}`} />

      {blockByHeight ? (
        <Link
          href={`/blocks/${blockByHeight.height}`}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-slate-200"
        >
          Block {blockByHeight.height}
        </Link>
      ) : null}

      {blockByHash ? (
        <Link
          href={`/blocks/${blockByHash.height}`}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-slate-200"
        >
          Block {blockByHash.height} ({shortenHash(blockByHash.hash)})
        </Link>
      ) : null}

      {txByHash ? (
        <Link
          href={`/txs/${txByHash.hash}`}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-slate-200"
        >
          Transaction {shortenHash(txByHash.hash)}
        </Link>
      ) : null}

      {address ? (
        <Link
          href={`/address/${address.address}`}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-slate-200"
        >
          Address {shortenHash(address.address)}
        </Link>
      ) : null}

      {!blockByHeight && !blockByHash && !txByHash && !address ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-slate-400">
          No matches found.
        </div>
      ) : null}
    </main>
  );
}
