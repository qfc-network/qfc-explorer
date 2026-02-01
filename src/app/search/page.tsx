import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
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

  const response = await fetchJsonSafe<{
    blockByHeight: { height: string } | null;
    blockByHash: { hash: string; height: string } | null;
    transaction: { hash: string } | null;
    address: { address: string } | null;
  }>(`/api/search?q=${encodeURIComponent(query)}`, { next: { revalidate: 5 } });

  const blockByHeight = response?.blockByHeight ?? null;
  const blockByHash = response?.blockByHash ?? null;
  const txByHash = response?.transaction ?? null;
  const address = response?.address ?? null;

  const suggestions = await fetchJsonSafe<{
    blockHeights: string[];
    blockHashes: Array<{ hash: string; height: string }>;
    txHashes: Array<{ hash: string; block_height: string }>;
    addresses: string[];
  }>(`/api/search/suggest?q=${encodeURIComponent(query)}`, { next: { revalidate: 5 } });

  const hasSuggestions =
    (suggestions?.blockHeights?.length ?? 0) > 0 ||
    (suggestions?.blockHashes?.length ?? 0) > 0 ||
    (suggestions?.txHashes?.length ?? 0) > 0 ||
    (suggestions?.addresses?.length ?? 0) > 0;

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

      {hasSuggestions ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Suggestions</p>
          <div className="mt-3 grid gap-2 text-sm text-slate-300">
            {suggestions?.blockHeights?.map((height) => (
              <Link key={`height-${height}`} href={`/blocks/${height}`} className="text-slate-200">
                Block {height}
              </Link>
            ))}
            {suggestions?.blockHashes?.map((block) => (
              <Link key={`block-${block.hash}`} href={`/blocks/${block.height}`} className="text-slate-200">
                Block {block.height} ({shortenHash(block.hash)})
              </Link>
            ))}
            {suggestions?.txHashes?.map((tx) => (
              <Link key={`tx-${tx.hash}`} href={`/txs/${tx.hash}`} className="text-slate-200">
                Transaction {shortenHash(tx.hash)}
              </Link>
            ))}
            {suggestions?.addresses?.map((addr) => (
              <Link key={`addr-${addr}`} href={`/address/${addr}`} className="text-slate-200">
                Address {shortenHash(addr)}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
