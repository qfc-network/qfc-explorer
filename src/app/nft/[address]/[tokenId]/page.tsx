export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiNftDetail } from '@/lib/api-types';
import { shortenHash } from '@/lib/format';
import CopyButton from '@/components/CopyButton';

/* ── Mock fallback data ─────────────────────────────────────────────── */
const MOCK_OWNER = '0x7a3b1c9d2e4f5a6b8c0d1e2f3a4b5c6d7e8f9a0b';

const MOCK_NFT = {
  name: 'QFC Dragon #42',
  description: 'A legendary dragon from the QFC universe',
  image: null as string | null,
  attributes: [
    { trait_type: 'Species', value: 'Dragon' },
    { trait_type: 'Element', value: 'Fire' },
    { trait_type: 'Rarity', value: 'Legendary' },
    { trait_type: 'Level', value: '99' },
  ],
};

const MOCK_TRANSFERS = [
  {
    tx_hash: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    block_height: 984201,
    from_address: '0x0000000000000000000000000000000000000000',
    to_address: MOCK_OWNER,
    timestamp: 1710200400000,
  },
  {
    tx_hash: '0xf1e2d3c4b5a6978869504132f1e2d3c4b5a69788695041320a1b2c3d4e5f6a7b',
    block_height: 991450,
    from_address: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    to_address: MOCK_OWNER,
    timestamp: 1710460800000,
  },
  {
    tx_hash: '0x0102030405060708091011121314151617181920212223242526272829303132',
    block_height: 995003,
    from_address: '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
    to_address: MOCK_OWNER,
    timestamp: 1710633600000,
  },
];

/* ── Metadata ────────────────────────────────────────────────────────── */
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
    MOCK_NFT.name;
  const collectionName = response?.data.token.name ?? shortenHash(address);
  const description =
    response?.data.nft.metadata.description ??
    MOCK_NFT.description;

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

/* ── Page ─────────────────────────────────────────────────────────────── */
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

  /* Resolve data — fall back to mock when API unavailable */
  const token = response?.data.token ?? { name: 'QFC Collection', symbol: 'QNFT', standard: 'erc721' };
  const meta = response?.data.nft.metadata ?? MOCK_NFT;
  const owner = response?.data.nft.owner ?? MOCK_OWNER;
  const transfers = response?.data.nft.transfers ?? MOCK_TRANSFERS;

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
            {owner && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Owner</span>
                <Link
                  href={`/address/${owner}`}
                  className="font-mono text-xs text-cyan-400 hover:text-cyan-300"
                >
                  {shortenHash(owner, 8, 6)}
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

          {/* Action links */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/token/${address}?tab=inventory`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              View Collection
            </Link>
            <a
              href={`https://nft.testnet.qfc.network/asset/${address}/${tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-500 transition-colors"
            >
              View on NFT Marketplace
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
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
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
              {transfers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No transfers found for this token.
                  </td>
                </tr>
              ) : (
                transfers.map((t, i) => (
                  <tr
                    key={`${t.tx_hash}-${i}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/40"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/tx/${t.tx_hash}`}
                        className="font-mono text-xs text-cyan-400 hover:text-cyan-300"
                      >
                        {shortenHash(t.tx_hash)}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/block/${t.block_height}`}
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
                    <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">
                      {t.timestamp
                        ? new Date(t.timestamp).toLocaleString('en-US', { hour12: false })
                        : '—'}
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
