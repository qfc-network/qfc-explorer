export const dynamic = "force-dynamic";

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiSearch, ApiSearchSuggest } from '@/lib/api-types';
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

  const response = await fetchJsonSafe<ApiSearch>(
    `/api/search?q=${encodeURIComponent(query)}`,
    { next: { revalidate: 5 } }
  );

  const blockByHeight = response?.data.blockByHeight ?? null;
  const blockByHash = response?.data.blockByHash ?? null;
  const txByHash = response?.data.transaction ?? null;
  const address = response?.data.address ?? null;

  const suggestions = await fetchJsonSafe<ApiSearchSuggest>(
    `/api/search/suggest?q=${encodeURIComponent(query)}`,
    { next: { revalidate: 5 } }
  );

  const hasSuggestions =
    (suggestions?.data.blockHeights?.length ?? 0) > 0 ||
    (suggestions?.data.blockHashes?.length ?? 0) > 0 ||
    (suggestions?.data.txHashes?.length ?? 0) > 0 ||
    (suggestions?.data.addresses?.length ?? 0) > 0;

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
            {suggestions?.data.blockHeights?.map((height) => (
              <Link key={`height-${height}`} href={`/blocks/${height}`} className="text-slate-200">
                Block {height}
              </Link>
            ))}
            {suggestions?.data.blockHashes?.map((block) => (
              <Link key={`block-${block.hash}`} href={`/blocks/${block.height}`} className="text-slate-200">
                Block {block.height} ({shortenHash(block.hash)})
              </Link>
            ))}
            {suggestions?.data.txHashes?.map((tx) => (
              <Link key={`tx-${tx.hash}`} href={`/txs/${tx.hash}`} className="text-slate-200">
                Transaction {shortenHash(tx.hash)}
              </Link>
            ))}
            {suggestions?.data.addresses?.map((addr) => (
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
