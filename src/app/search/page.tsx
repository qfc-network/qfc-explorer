export const dynamic = "force-dynamic";

export const metadata = { title: 'Search', description: 'Search QFC blockchain' };

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
  const tokens = response?.data.tokens ?? [];

  const suggestions = await fetchJsonSafe<ApiSearchSuggest>(
    `/api/search/suggest?q=${encodeURIComponent(query)}`,
    { next: { revalidate: 5 } }
  );

  const hasSuggestions =
    (suggestions?.data.blockHeights?.length ?? 0) > 0 ||
    (suggestions?.data.blockHashes?.length ?? 0) > 0 ||
    (suggestions?.data.txHashes?.length ?? 0) > 0 ||
    (suggestions?.data.addresses?.length ?? 0) > 0 ||
    (suggestions?.data.tokens?.length ?? 0) > 0;

  const hasResults = blockByHeight || blockByHash || txByHash || address || tokens.length > 0;

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

      {tokens.length > 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Tokens</p>
          <div className="grid gap-2">
            {tokens.map((token) => (
              <Link
                key={token.address}
                href={`/token/${token.address}`}
                className="flex items-center gap-3 rounded-lg border border-slate-800/60 bg-slate-800/30 px-4 py-3 hover:border-cyan-500/30 hover:bg-slate-800/50 transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 text-xs font-bold text-cyan-400">
                  {(token.symbol || '?')[0]}
                </span>
                <div>
                  <p className="text-sm text-slate-200">{token.name || 'Unknown Token'}</p>
                  <p className="text-xs text-slate-500">{token.symbol || '—'} · {token.token_type} · {shortenHash(token.address)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {!hasResults ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
            <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-sm text-slate-300">No results found for &quot;{query}&quot;</p>
          <p className="mt-2 text-xs text-slate-500">Try searching with:</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-500">
            <li>A block number (e.g. <span className="text-slate-400">42</span>)</li>
            <li>A transaction hash (e.g. <span className="text-slate-400">0xabc...def</span>)</li>
            <li>An address (e.g. <span className="text-slate-400">0x1234...5678</span>)</li>
            <li>A token name or symbol (e.g. <span className="text-slate-400">QFC</span>)</li>
          </ul>
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
            {suggestions?.data.tokens?.map((token) => (
              <Link key={`token-${token.address}`} href={`/token/${token.address}`} className="text-slate-200">
                Token: {token.name || token.symbol || shortenHash(token.address)}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
