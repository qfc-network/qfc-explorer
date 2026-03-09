export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiNftDetail } from '@/lib/api-types';
import { shortenHash } from '@/lib/format';
import CopyButton from '@/components/CopyButton';

export async function generateMetadata({
  params,
}: {
  params: { address: string; tokenId: string };
}): Promise<Metadata> {
  const address = params.address.toLowerCase();
  const response = await fetchJsonSafe<ApiNftDetail>(
    `/api/tokens/${address}/nft/${params.tokenId}`,
    { next: { revalidate: 30 } },
  );

  const nftName =
    response?.data.nft.metadata.name ??
    `#${params.tokenId}`;
  const collectionName = response?.data.token.name ?? shortenHash(address);
  const description =
    response?.data.nft.metadata.description ??
    `NFT ${nftName} from ${collectionName} on the QFC blockchain.`;

  return {
    title: `${nftName} — ${collectionName}`,
    description,
    openGraph: {
      title: `${nftName} — ${collectionName} | QFC Explorer`,
      description,
      type: 'article',
      ...(response?.data.nft.metadata.image
        ? { images: [{ url: response.data.nft.metadata.image }] }
        : {}),
    },
  };
}

export default async function NftDetailPage({
  params,
}: {
  params: { address: string; tokenId: string };
}) {
  const address = params.address.toLowerCase();
  const tokenId = params.tokenId;

  const response = await fetchJsonSafe<ApiNftDetail>(
    `/api/tokens/${address}/nft/${tokenId}`,
    { next: { revalidate: 20 } },
  );

  if (!response) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-8 text-center">
          <p className="text-lg text-slate-900 dark:text-white">NFT not found</p>
          <p className="mt-2 text-sm text-slate-400 font-mono">
            {address} #{tokenId}
          </p>
          <Link
            href={`/token/${address}`}
            className="mt-4 inline-block rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Back to collection
          </Link>
        </div>
      </main>
    );
  }

  const { token, nft } = response.data;
  const meta = nft.metadata;
  const displayName = meta.name ?? `#${tokenId}`;

  const standardLabel =
    token.standard === 'erc721'
      ? 'ERC-721'
      : token.standard === 'erc1155'
        ? 'ERC-1155'
        : token.standard;
  const standardClass =
    token.standard === 'erc721'
      ? 'bg-purple-500/10 text-purple-400'
      : 'bg-orange-500/10 text-orange-400';

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
        <Link href="/tokens" className="hover:text-slate-900 dark:hover:text-white">
          Tokens
        </Link>
        <span>/</span>
        <Link
          href={`/token/${address}`}
          className="hover:text-slate-900 dark:hover:text-white"
        >
          {token.name ?? shortenHash(address)}
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white">#{tokenId}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Image */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 overflow-hidden">
          <div className="relative aspect-square bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            {meta.image ? (
              <Image
                src={meta.image}
                alt={displayName}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain"
                unoptimized={meta.image.startsWith('data:')}
              />
            ) : (
              <span className="text-6xl font-bold text-slate-700">
                #{tokenId.length > 6 ? tokenId.slice(0, 6) : tokenId}
              </span>
            )}
          </div>
        </div>

        {/* Right: Info */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {displayName}
              </h1>
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${standardClass}`}
              >
                {standardLabel}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {token.name ?? 'Collection'}
              {token.symbol && (
                <span className="ml-1 text-slate-500">({token.symbol})</span>
              )}
            </p>
          </div>

          {/* Description */}
          {meta.description && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4">
              <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">
                Description
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">
                {meta.description}
              </p>
            </div>
          )}

          {/* Details */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">
              Details
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Contract</span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/token/${address}`}
                  className="font-mono text-xs text-cyan-400 hover:text-cyan-300"
                >
                  {shortenHash(address, 8, 6)}
                </Link>
                <CopyButton value={address} label="Copy" />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Token ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-900 dark:text-white">
                  {tokenId.length > 20
                    ? `${tokenId.slice(0, 10)}...${tokenId.slice(-10)}`
                    : tokenId}
                </span>
                <CopyButton value={tokenId} label="Copy" />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Standard</span>
              <span className="text-slate-900 dark:text-white">{standardLabel}</span>
            </div>
            {nft.owner && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Owner</span>
                <Link
                  href={`/address/${nft.owner}`}
                  className="font-mono text-xs text-cyan-400 hover:text-cyan-300"
                >
                  {shortenHash(nft.owner, 8, 6)}
                </Link>
              </div>
            )}
          </div>

          {/* Attributes */}
          {meta.attributes && meta.attributes.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4">
              <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-3">
                Attributes
              </p>
              <div className="flex flex-wrap gap-2">
                {meta.attributes.map((attr, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5"
                  >
                    {attr.trait_type && (
                      <p className="text-[10px] uppercase text-cyan-400/70">
                        {attr.trait_type}
                      </p>
                    )}
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {attr.value != null ? String(attr.value) : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View Collection link */}
          <Link
            href={`/token/${address}?tab=inventory`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            View Collection
          </Link>
        </div>
      </div>

      {/* Transfer History */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Transfer History
        </h2>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/60 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Tx Hash</th>
                <th className="px-4 py-3">Block</th>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
              {nft.transfers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No transfers found for this token.
                  </td>
                </tr>
              ) : (
                nft.transfers.map((t, i) => (
                  <tr
                    key={`${t.tx_hash}-${i}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/40"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/txs/${t.tx_hash}`}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        {shortenHash(t.tx_hash)}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/blocks/${t.block_height}`}
                        className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      >
                        {t.block_height}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/address/${t.from_address}`}
                        className="font-mono text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      >
                        {shortenHash(t.from_address)}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/address/${t.to_address}`}
                        className="font-mono text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      >
                        {shortenHash(t.to_address)}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
