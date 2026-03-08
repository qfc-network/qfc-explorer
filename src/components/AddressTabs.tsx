'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { shortenHash, formatWeiToQfc } from '@/lib/format';
import { getApiBaseUrl } from '@/lib/api-client';
import ExportButton from '@/components/ExportButton';

type Tab = 'transactions' | 'token_transfers' | 'token_holdings' | 'nft_holdings' | 'contract';

type Transaction = {
  hash: string;
  block_height: string;
  from_address: string;
  to_address: string | null;
  value: string;
  status: string;
};

type TokenTransfer = {
  tx_hash: string;
  block_height: string;
  token_address: string;
  from_address: string;
  to_address: string;
  value: string;
  token_name: string | null;
  token_symbol: string | null;
  token_decimals: number | null;
};

type TokenHolding = {
  token_address: string;
  token_name: string | null;
  token_symbol: string | null;
  token_decimals: number | null;
  token_type: string;
  balance: string;
};

type NftHolding = {
  token_address: string;
  token_name: string | null;
  token_symbol: string | null;
  token_type: string;
  token_id: string;
  balance: string;
};

type ContractInfo = {
  creator_tx_hash: string | null;
  created_at_block: string | null;
  code_hash: string | null;
  is_verified: boolean;
};

type Props = {
  address: string;
  transactions: Transaction[];
  tokenTransfers: TokenTransfer[];
  tokenHoldings: TokenHolding[];
  nftHoldings: NftHolding[];
  contract: ContractInfo | null;
  currentTab: string;
  page: number;
  txCount: string;
  tokenTransferCount: string;
};

const TABS: { key: Tab; label: string; countKey: keyof Pick<Props, 'txCount' | 'tokenTransferCount'> | null }[] = [
  { key: 'transactions', label: 'Transactions', countKey: 'txCount' },
  { key: 'token_transfers', label: 'Token Transfers', countKey: 'tokenTransferCount' },
  { key: 'token_holdings', label: 'Token Holdings', countKey: null },
  { key: 'nft_holdings', label: 'NFT Holdings', countKey: null },
  { key: 'contract', label: 'Contract', countKey: null },
];

function formatTokenValue(value: string, decimals: number | null): string {
  if (decimals == null || decimals === 0) return value;
  try {
    const val = BigInt(value);
    const base = 10n ** BigInt(decimals);
    const whole = val / base;
    const frac = val % base;
    if (frac === 0n) return whole.toString();
    const fracStr = frac.toString().padStart(decimals, '0').slice(0, 4).replace(/0+$/, '');
    return `${whole}.${fracStr}`;
  } catch {
    return value;
  }
}

export default function AddressTabs(props: Props) {
  const { address, transactions, tokenTransfers, tokenHoldings, nftHoldings, contract, currentTab, page } = props;
  const activeTab = (currentTab as Tab) || 'transactions';

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-slate-800">
        {TABS.map((tab) => {
          if (tab.key === 'contract' && !contract) return null;
          if (tab.key === 'token_holdings' && tokenHoldings.length === 0) return null;
          if (tab.key === 'nft_holdings' && nftHoldings.length === 0) return null;
          const isActive = activeTab === tab.key;
          const count = tab.countKey ? props[tab.countKey] : null;
          return (
            <Link
              key={tab.key}
              href={`/address/${address}?tab=${tab.key}&page=1`}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'border-cyan-400 text-white'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              {tab.label}
              {count && Number(count) > 0 ? (
                <span className="ml-1.5 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  {count}
                </span>
              ) : tab.key === 'token_holdings' && tokenHoldings.length > 0 ? (
                <span className="ml-1.5 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  {tokenHoldings.length}
                </span>
              ) : tab.key === 'nft_holdings' && nftHoldings.length > 0 ? (
                <span className="ml-1.5 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  {nftHoldings.length}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Export buttons */}
      {(activeTab === 'transactions' || activeTab === 'token_transfers') && (
        <div className="mt-3 flex justify-end">
          <ExportButton
            endpoint={`/api/analytics/export?type=${activeTab === 'token_transfers' ? 'token_transfers' : 'transactions'}&address=${address}`}
            filename={`qfc_${address.slice(0, 10)}_${activeTab}`}
          />
        </div>
      )}

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === 'transactions' && (
          <TransactionsTab address={address} transactions={transactions} page={page} />
        )}
        {activeTab === 'token_transfers' && (
          <TokenTransfersTab address={address} transfers={tokenTransfers} page={page} />
        )}
        {activeTab === 'token_holdings' && (
          <TokenHoldingsTab holdings={tokenHoldings} />
        )}
        {activeTab === 'nft_holdings' && (
          <NftHoldingsTab address={address} holdings={nftHoldings} />
        )}
        {activeTab === 'contract' && contract && (
          <ContractTab address={address} contract={contract} />
        )}
      </div>
    </div>
  );
}

function TransactionsTab({ address, transactions, page }: { address: string; transactions: Transaction[]; page: number }) {
  if (transactions.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No transactions found.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2">Tx Hash</th>
              <th className="px-3 py-2">Block</th>
              <th className="px-3 py-2">Direction</th>
              <th className="px-3 py-2">From</th>
              <th className="px-3 py-2">To</th>
              <th className="px-3 py-2 text-right">Value</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {transactions.map((tx) => {
              const isOut = tx.from_address.toLowerCase() === address.toLowerCase();
              return (
                <tr key={tx.hash} className="hover:bg-slate-900/40">
                  <td className="px-3 py-2.5">
                    <Link href={`/txs/${tx.hash}`} className="text-cyan-400 hover:text-cyan-300">
                      {shortenHash(tx.hash)}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/blocks/${tx.block_height}`} className="text-slate-300 hover:text-white">
                      {tx.block_height}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                      isOut ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {isOut ? 'OUT' : 'IN'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {tx.from_address.toLowerCase() === address.toLowerCase() ? (
                      <span className="text-slate-500">{shortenHash(tx.from_address)}</span>
                    ) : (
                      <Link href={`/address/${tx.from_address}`} className="text-slate-300 hover:text-white">
                        {shortenHash(tx.from_address)}
                      </Link>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {tx.to_address ? (
                      tx.to_address.toLowerCase() === address.toLowerCase() ? (
                        <span className="text-slate-500">{shortenHash(tx.to_address)}</span>
                      ) : (
                        <Link href={`/address/${tx.to_address}`} className="text-slate-300 hover:text-white">
                          {shortenHash(tx.to_address)}
                        </Link>
                      )
                    ) : (
                      <span className="text-emerald-400">Contract Creation</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-300">
                    {formatWeiToQfc(tx.value)} QFC
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs ${tx.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination address={address} tab="transactions" page={page} hasMore={transactions.length === 25} />
    </>
  );
}

function TokenTransfersTab({ address, transfers, page }: { address: string; transfers: TokenTransfer[]; page: number }) {
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return transfers;
    if (filter === 'in') return transfers.filter((t) => t.to_address.toLowerCase() === address.toLowerCase());
    return transfers.filter((t) => t.from_address.toLowerCase() === address.toLowerCase());
  }, [transfers, filter, address]);

  if (transfers.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No token transfers found.</p>;
  }

  return (
    <>
      <div className="mb-3 flex gap-2">
        {(['all', 'in', 'out'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {f === 'all' ? 'All' : f === 'in' ? 'Incoming' : 'Outgoing'}
            {f !== 'all' && (
              <span className="ml-1 text-slate-500">
                ({f === 'in'
                  ? transfers.filter((t) => t.to_address.toLowerCase() === address.toLowerCase()).length
                  : transfers.filter((t) => t.from_address.toLowerCase() === address.toLowerCase()).length
                })
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2">Tx Hash</th>
              <th className="px-3 py-2">Block</th>
              <th className="px-3 py-2">From</th>
              <th className="px-3 py-2">To</th>
              <th className="px-3 py-2 text-right">Value</th>
              <th className="px-3 py-2">Token</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filtered.map((t, i) => (
              <tr key={`${t.tx_hash}-${i}`} className="hover:bg-slate-900/40">
                <td className="px-3 py-2.5">
                  <Link href={`/txs/${t.tx_hash}`} className="text-cyan-400 hover:text-cyan-300">
                    {shortenHash(t.tx_hash)}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/blocks/${t.block_height}`} className="text-slate-300 hover:text-white">
                    {t.block_height}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/address/${t.from_address}`} className={`${t.from_address.toLowerCase() === address.toLowerCase() ? 'text-slate-500' : 'text-slate-300 hover:text-white'}`}>
                    {shortenHash(t.from_address)}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/address/${t.to_address}`} className={`${t.to_address.toLowerCase() === address.toLowerCase() ? 'text-slate-500' : 'text-slate-300 hover:text-white'}`}>
                    {shortenHash(t.to_address)}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-right text-slate-300">
                  {formatTokenValue(t.value, t.token_decimals)}
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/token/${t.token_address}`} className="text-cyan-400 hover:text-cyan-300">
                    {t.token_symbol ?? shortenHash(t.token_address)}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination address={address} tab="token_transfers" page={page} hasMore={transfers.length === 25} />
    </>
  );
}

function TokenHoldingsTab({ holdings }: { holdings: TokenHolding[] }) {
  if (holdings.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No token holdings found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Token</th>
            <th className="px-3 py-2">Contract</th>
            <th className="px-3 py-2 text-right">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {holdings.map((h, i) => (
            <tr key={h.token_address} className="hover:bg-slate-900/40">
              <td className="px-3 py-2.5 text-slate-500">{i + 1}</td>
              <td className="px-3 py-2.5">
                <Link href={`/token/${h.token_address}`} className="group">
                  <span className="font-medium text-white group-hover:text-cyan-300">
                    {h.token_name ?? 'Unknown'}
                  </span>
                  {h.token_symbol && (
                    <span className="ml-2 text-xs text-slate-400">({h.token_symbol})</span>
                  )}
                </Link>
              </td>
              <td className="px-3 py-2.5">
                <Link href={`/address/${h.token_address}`} className="font-mono text-xs text-cyan-400 hover:text-cyan-300">
                  {shortenHash(h.token_address)}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-right text-slate-300">
                {formatTokenValue(h.balance, h.token_decimals)}
                {h.token_symbol && <span className="ml-1 text-xs text-slate-400">{h.token_symbol}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type NftMetadata = {
  tokenAddress: string;
  tokenId: string;
  metadata: { uri: string; name?: string; description?: string; image?: string } | null;
};

function NftHoldingsTab({ address, holdings }: { address: string; holdings: NftHolding[] }) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [metadataMap, setMetadataMap] = useState<Record<string, NftMetadata['metadata']>>({});

  useEffect(() => {
    if (holdings.length === 0) return;
    const base = getApiBaseUrl();
    const url = base ? `${base}/address/${address}/nft-metadata` : `/api/address/${address}/nft-metadata`;
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        const map: Record<string, NftMetadata['metadata']> = {};
        for (const nft of json.data?.nfts ?? []) {
          map[`${nft.tokenAddress}:${nft.tokenId}`] = nft.metadata;
        }
        setMetadataMap(map);
      })
      .catch(() => {});
  }, [address, holdings.length]);

  if (holdings.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No NFT holdings found.</p>;
  }

  return (
    <div>
      {/* View toggle */}
      <div className="mb-4 flex justify-end gap-1">
        <button
          onClick={() => setView('grid')}
          className={`rounded-lg p-2 transition-colors ${view === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
          title="Grid view"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z" />
          </svg>
        </button>
        <button
          onClick={() => setView('list')}
          className={`rounded-lg p-2 transition-colors ${view === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
          title="List view"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M2.5 12a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z" />
          </svg>
        </button>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {holdings.map((h) => {
            const meta = metadataMap[`${h.token_address}:${h.token_id}`];
            const imageUrl = meta?.image;
            const nftName = meta?.name;
            return (
              <Link
                key={`${h.token_address}-${h.token_id}`}
                href={`/token/${h.token_address}`}
                className="group rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden hover:border-slate-600 transition-colors"
              >
                {/* Image or placeholder */}
                <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={nftName ?? `#${h.token_id}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML =
                          `<span class="text-3xl font-bold text-slate-700">#${h.token_id.length > 4 ? h.token_id.slice(0, 4) : h.token_id}</span>`;
                      }}
                    />
                  ) : (
                    <span className="text-3xl font-bold text-slate-700 group-hover:text-slate-600 transition-colors">
                      #{h.token_id.length > 4 ? h.token_id.slice(0, 4) : h.token_id}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-white truncate group-hover:text-cyan-300">
                    {nftName ?? h.token_name ?? shortenHash(h.token_address)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Token ID: <span className="font-mono">{h.token_id.length > 8 ? `${h.token_id.slice(0, 8)}...` : h.token_id}</span>
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      h.token_type === 'erc721' ? 'bg-purple-500/10 text-purple-400' : 'bg-orange-500/10 text-orange-400'
                    }`}>
                      {h.token_type === 'erc721' ? '721' : '1155'}
                    </span>
                    {h.token_type !== 'erc721' && (
                      <span className="text-[10px] text-slate-500">x{h.balance}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Collection</th>
                <th className="px-3 py-2">Token ID</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {holdings.map((h, i) => (
                <tr key={`${h.token_address}-${h.token_id}`} className="hover:bg-slate-900/40">
                  <td className="px-3 py-2.5 text-slate-500">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <Link href={`/token/${h.token_address}`} className="group">
                      <span className="font-medium text-white group-hover:text-cyan-300">
                        {h.token_name ?? shortenHash(h.token_address)}
                      </span>
                      {h.token_symbol && (
                        <span className="ml-2 text-xs text-slate-400">({h.token_symbol})</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs text-cyan-400">#{h.token_id}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                      h.token_type === 'erc721' ? 'bg-purple-500/10 text-purple-400' : 'bg-orange-500/10 text-orange-400'
                    }`}>
                      {h.token_type === 'erc721' ? 'ERC-721' : 'ERC-1155'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-300">
                    {h.token_type === 'erc721' ? '1' : h.balance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ContractTab({ address, contract }: { address: string; contract: ContractInfo }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Verified</p>
            <p className="mt-1 text-sm">
              {contract.is_verified ? (
                <span className="text-emerald-400">Yes</span>
              ) : (
                <span className="text-slate-400">No</span>
              )}
            </p>
          </div>
          {contract.creator_tx_hash && (
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Creator Tx</p>
              <p className="mt-1 text-sm">
                <Link href={`/txs/${contract.creator_tx_hash}`} className="text-cyan-400 hover:text-cyan-300">
                  {shortenHash(contract.creator_tx_hash)}
                </Link>
              </p>
            </div>
          )}
          {contract.created_at_block && (
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Created at Block</p>
              <p className="mt-1 text-sm">
                <Link href={`/blocks/${contract.created_at_block}`} className="text-slate-300 hover:text-white">
                  {contract.created_at_block}
                </Link>
              </p>
            </div>
          )}
          {contract.code_hash && (
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Code Hash</p>
              <p className="mt-1 text-sm text-slate-400 font-mono text-xs break-all">{contract.code_hash}</p>
            </div>
          )}
        </div>
      </div>
      <div className="text-center">
        <Link
          href={`/contract/${address}`}
          className="inline-block rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 transition-colors"
        >
          View Full Contract Page
        </Link>
      </div>
    </div>
  );
}

function Pagination({ address, tab, page, hasMore }: { address: string; tab: string; page: number; hasMore: boolean }) {
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
      {page > 1 ? (
        <Link
          href={`/address/${address}?tab=${tab}&page=${page - 1}`}
          className="rounded-lg border border-slate-800 px-4 py-2 hover:bg-slate-900 transition-colors"
        >
          Previous
        </Link>
      ) : (
        <span className="rounded-lg border border-slate-800/40 px-4 py-2 text-slate-600">Previous</span>
      )}
      <span>Page {page}</span>
      {hasMore ? (
        <Link
          href={`/address/${address}?tab=${tab}&page=${page + 1}`}
          className="rounded-lg border border-slate-800 px-4 py-2 hover:bg-slate-900 transition-colors"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-lg border border-slate-800/40 px-4 py-2 text-slate-600">Next</span>
      )}
    </div>
  );
}
