export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiTokenDetail, ApiTokenHolders } from '@/lib/api-types';
import { shortenHash } from '@/lib/format';
import CopyButton from '@/components/CopyButton';
import { fetchNftMetadataBatch, type NftMetadata } from '@/lib/nft-metadata';
import NftCard from '@/components/NftCard';
import TokenHoldersCsvExport from '@/components/TokenHoldersCsvExport';

export async function generateMetadata({ params }: { params: { address: string } }): Promise<Metadata> {
  const response = await fetchJsonSafe<ApiTokenDetail>(
    `/api/tokens/${params.address.toLowerCase()}`,
    { next: { revalidate: 20 } }
  );
  const name = response?.data.token?.name ?? shortenHash(params.address);
  const symbol = response?.data.token?.symbol;
  const displayName = symbol ? `${name} (${symbol})` : name;
  return {
    title: `Token ${displayName}`,
    description: `Token ${displayName} on the QFC blockchain — supply, holders, and transfers.`,
    openGraph: {
      title: `Token ${displayName} | QFC Explorer`,
      description: `Token ${displayName} on the QFC blockchain.`,
      type: 'article',
    },
  };
}

const PAGE_SIZE = 25;

function formatTokenValue(value: string, decimals: number | null): string {
  if (!value) return '0';
  try {
    const val = BigInt(value);
    const dec = decimals ?? 18;
    const base = 10n ** BigInt(dec);
    const whole = val / base;
    const frac = val % base;
    const wholeStr = whole.toLocaleString('en-US');
    if (frac === 0n) return wholeStr;
    const fracStr = frac.toString().padStart(dec, '0').slice(0, 4).replace(/0+$/, '');
    return `${wholeStr}.${fracStr}`;
  } catch {
    return value;
  }
}

function formatSupplyShort(supply: string | null, decimals: number | null): string {
  if (!supply) return '—';
  try {
    const val = BigInt(supply);
    const dec = decimals ?? 18;
    const base = 10n ** BigInt(dec);
    const whole = Number(val / base);
    if (whole >= 1_000_000_000) return `${(whole / 1_000_000_000).toFixed(2)}B`;
    if (whole >= 1_000_000) return `${(whole / 1_000_000).toFixed(2)}M`;
    if (whole >= 1_000) return `${(whole / 1_000).toFixed(2)}K`;
    return whole.toLocaleString('en-US');
  } catch {
    return supply;
  }
}

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  erc20: { label: 'ERC-20', className: 'bg-cyan-500/10 text-cyan-400' },
  erc721: { label: 'ERC-721', className: 'bg-purple-500/10 text-purple-400' },
  erc1155: { label: 'ERC-1155', className: 'bg-orange-500/10 text-orange-400' },
};

export default async function TokenDetailPage({
  params,
  searchParams,
}: {
  params: { address: string };
  searchParams: { page?: string; tab?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const tab = searchParams.tab ?? 'transfers';
  const address = params.address.toLowerCase();

  const [response, holdersResponse] = await Promise.all([
    fetchJsonSafe<ApiTokenDetail>(
      `/api/tokens/${address}?page=${page}&limit=${PAGE_SIZE}`,
      { next: { revalidate: 20 } }
    ),
    fetchJsonSafe<ApiTokenHolders>(
      `/api/tokens/${address}/holders?limit=50`,
      { next: { revalidate: 30 } }
    ),
  ]);

  const token = response?.data.token ?? null;
  const transfers = response?.data.transfers ?? [];
  const holders = holdersResponse?.data.holders ?? [];
  const nftHolders = holdersResponse?.data.nftHolders ?? [];

  // Fetch NFT metadata for inventory tab (server-side)
  let nftMetadataMap: Record<string, NftMetadata | null> = {};
  const isNftToken = token && (token.token_type === 'erc721' || token.token_type === 'erc1155');
  if (isNftToken && tab === 'inventory' && nftHolders.length > 0) {
    try {
      const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
      const items = nftHolders.slice(0, 50).map((h) => ({
        contractAddress: address,
        tokenId: h.token_id,
      }));
      const results = await fetchNftMetadataBatch(items, rpcUrl, 4);
      for (const r of results) {
        nftMetadataMap[r.tokenId] = r.metadata;
      }
    } catch {
      // metadata fetch failure is non-critical
    }
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
          <p className="text-lg text-white">Token not found</p>
          <p className="mt-2 text-sm text-slate-400 font-mono">{address}</p>
          <Link href="/tokens" className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
            Back to tokens
          </Link>
        </div>
      </main>
    );
  }

  const isNft = token.token_type === 'erc721' || token.token_type === 'erc1155';
  const typeConf = TYPE_CONFIG[token.token_type] ?? TYPE_CONFIG.erc20;

  // Calculate total for percentage (ERC-20 only)
  const totalHolderBalance = holders.reduce((sum, h) => {
    try { return sum + BigInt(h.balance); } catch { return sum; }
  }, 0n);

  function holderPercent(balance: string): string {
    try {
      const val = BigInt(balance);
      if (totalHolderBalance === 0n) return '—';
      const pct = Number((val * 10000n) / totalHolderBalance) / 100;
      return `${pct.toFixed(2)}%`;
    } catch {
      return '—';
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold text-white">
          {token.name ?? 'Token'}
          {token.symbol && <span className="ml-2 text-slate-400">({token.symbol})</span>}
        </h1>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${typeConf.className}`}>
          {typeConf.label}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="font-mono text-sm text-slate-400">{address}</span>
        <CopyButton value={address} label="Copy" />
      </div>

      {/* Overview */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {!isNft && (
          <OverviewCard label="Total Supply" value={formatSupplyShort(token.total_supply, token.decimals)} sub={token.symbol ?? undefined} />
        )}
        {!isNft && (
          <OverviewCard label="Decimals" value={String(token.decimals ?? '—')} />
        )}
        <OverviewCard
          label="Holders"
          value={String(isNft ? nftHolders.length : holders.length)}
          sub="indexed"
        />
        {isNft && (
          <OverviewCard label="Items" value={String(nftHolders.length)} sub="unique tokens" />
        )}
        <OverviewCard label="Transfers" value={transfers.length >= PAGE_SIZE ? `${PAGE_SIZE}+` : String(transfers.length)} sub="this page" />
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-0 border-b border-slate-800">
        <TabLink href={`/token/${address}?tab=transfers&page=1`} active={tab === 'transfers'} label="Transfers" />
        {!isNft && (
          <TabLink href={`/token/${address}?tab=holders&page=1`} active={tab === 'holders'} label="Holders" count={holders.length} />
        )}
        {isNft && (
          <TabLink href={`/token/${address}?tab=inventory&page=1`} active={tab === 'inventory'} label="Inventory" count={nftHolders.length} />
        )}
      </div>

      {/* Transfers Tab */}
      {tab === 'transfers' && (
        <div className="mt-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Tx Hash</th>
                  <th className="px-4 py-3">Block</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  {isNft && <th className="px-4 py-3">Token ID</th>}
                  <th className="px-4 py-3 text-right">{isNft ? 'Qty' : 'Value'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {transfers.length === 0 ? (
                  <tr><td colSpan={isNft ? 6 : 5} className="px-4 py-8 text-center text-slate-500">No transfers indexed.</td></tr>
                ) : (
                  transfers.map((t, i) => (
                    <tr key={`${t.tx_hash}-${i}`} className="hover:bg-slate-900/40">
                      <td className="px-4 py-2.5">
                        <Link href={`/txs/${t.tx_hash}`} className="text-cyan-400 hover:text-cyan-300">{shortenHash(t.tx_hash)}</Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <Link href={`/blocks/${t.block_height}`} className="text-slate-300 hover:text-white">{t.block_height}</Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <Link href={`/address/${t.from_address}`} className="font-mono text-xs text-slate-300 hover:text-white">{shortenHash(t.from_address)}</Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <Link href={`/address/${t.to_address}`} className="font-mono text-xs text-slate-300 hover:text-white">{shortenHash(t.to_address)}</Link>
                      </td>
                      {isNft && (
                        <td className="px-4 py-2.5">
                          {t.token_id ? <span className="font-mono text-xs text-purple-400">#{t.token_id}</span> : '—'}
                        </td>
                      )}
                      <td className="px-4 py-2.5 text-right text-slate-300">
                        {isNft ? t.value : `${formatTokenValue(t.value, token.decimals)} ${token.symbol ?? ''}`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination base={`/token/${address}?tab=transfers`} page={page} hasMore={transfers.length === PAGE_SIZE} />
        </div>
      )}

      {/* ERC-20 Holders Tab */}
      {tab === 'holders' && !isNft && (
        <div className="mt-4">
          {holders.length > 0 && (
            <div className="mb-3 flex justify-end">
              <TokenHoldersCsvExport holders={holders} tokenDecimals={token.decimals} tokenSymbol={token.symbol} />
            </div>
          )}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3 text-right">Share</th>
                  <th className="px-4 py-3">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {holders.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No holders indexed.</td></tr>
                ) : (
                  holders.map((h, i) => {
                    const pct = holderPercent(h.balance);
                    const pctNum = parseFloat(pct) || 0;
                    return (
                      <tr key={h.address} className="hover:bg-slate-900/40">
                        <td className="px-4 py-2.5 text-slate-500">{i + 1}</td>
                        <td className="px-4 py-2.5">
                          <Link href={`/address/${h.address}`} className="font-mono text-xs text-cyan-400 hover:text-cyan-300">
                            {shortenHash(h.address, 8, 6)}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-300">
                          {formatTokenValue(h.balance, token.decimals)} {token.symbol ?? ''}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-300">{pct}</td>
                        <td className="px-4 py-2.5">
                          <div className="h-2 w-24 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full bg-cyan-400/60" style={{ width: `${Math.min(100, pctNum)}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NFT Inventory Tab — Gallery View */}
      {tab === 'inventory' && isNft && (
        <div className="mt-4">
          {nftHolders.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No items indexed.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {nftHolders.map((h) => {
                  const meta = nftMetadataMap[h.token_id];
                  return (
                    <div key={`${h.address}-${h.token_id}`} className="flex flex-col">
                      <NftCard
                        tokenAddress={address}
                        tokenId={h.token_id}
                        collectionName={token.name}
                        nftName={meta?.name}
                        imageUrl={meta?.image}
                        tokenType={token.token_type}
                        balance={h.balance}
                      />
                      <p className="mt-1 text-center text-[10px] text-slate-500">
                        Owner:{' '}
                        <Link href={`/address/${h.address}`} className="text-cyan-400 hover:text-cyan-300 font-mono">
                          {shortenHash(h.address, 6, 4)}
                        </Link>
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}

function OverviewCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1.5 text-sm font-medium text-white">
        {value}
        {sub && <span className="ml-1 text-xs text-slate-400">{sub}</span>}
      </p>
    </div>
  );
}

function TabLink({ href, active, label, count }: { href: string; active: boolean; label: string; count?: number }) {
  return (
    <Link
      href={href}
      className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
        active ? 'border-cyan-400 text-white' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
      }`}
    >
      {label}
      {count != null && count > 0 && (
        <span className="ml-1.5 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{count}</span>
      )}
    </Link>
  );
}

function Pagination({ base, page, hasMore }: { base: string; page: number; hasMore: boolean }) {
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
      {page > 1 ? (
        <Link href={`${base}&page=${page - 1}`} className="rounded-lg border border-slate-800 px-4 py-2 hover:bg-slate-900">Previous</Link>
      ) : (
        <span className="rounded-lg border border-slate-800/40 px-4 py-2 text-slate-600">Previous</span>
      )}
      <span>Page {page}</span>
      {hasMore ? (
        <Link href={`${base}&page=${page + 1}`} className="rounded-lg border border-slate-800 px-4 py-2 hover:bg-slate-900">Next</Link>
      ) : (
        <span className="rounded-lg border border-slate-800/40 px-4 py-2 text-slate-600">Next</span>
      )}
    </div>
  );
}
