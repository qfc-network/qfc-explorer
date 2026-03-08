'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { shortenHash, formatWeiToQfc } from '@/lib/format';
import { getApiBaseUrl } from '@/lib/api-client';
import ExportButton from '@/components/ExportButton';
import CsvExport from '@/components/CsvExport';
import AddressExportModal from '@/components/AddressExportModal';
import { useTranslation } from '@/components/LocaleProvider';
import type { TranslationKey } from '@/lib/translations/en';

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
  nextCursor?: string | null;
  txCount: string;
  tokenTransferCount: string;
};

const TAB_KEYS: { key: Tab; labelKey: TranslationKey; countKey: keyof Pick<Props, 'txCount' | 'tokenTransferCount'> | null }[] = [
  { key: 'transactions', labelKey: 'address.transactions', countKey: 'txCount' },
  { key: 'token_transfers', labelKey: 'address.tokenTransfers', countKey: 'tokenTransferCount' },
  { key: 'token_holdings', labelKey: 'address.tokenHoldings', countKey: null },
  { key: 'nft_holdings', labelKey: 'address.nftHoldings', countKey: null },
  { key: 'contract', labelKey: 'contract.title', countKey: null },
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
  const { address, transactions, tokenTransfers, tokenHoldings, nftHoldings, contract, currentTab, page, nextCursor } = props;
  const activeTab = (currentTab as Tab) || 'transactions';
  const { t } = useTranslation();

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-slate-800">
        {TAB_KEYS.map((tab) => {
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
              {t(tab.labelKey)}
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

      {/* Export with date range modal */}
      {(activeTab === 'transactions' || activeTab === 'token_transfers') && (
        <ExportModalTrigger address={address} type={activeTab === 'token_transfers' ? 'token_transfers' : 'transactions'} />
      )}

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === 'transactions' && (
          <TransactionsTab address={address} transactions={transactions} page={page} nextCursor={nextCursor} />
        )}
        {activeTab === 'token_transfers' && (
          <TokenTransfersTab address={address} transfers={tokenTransfers} page={page} nextCursor={nextCursor} />
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

function TransactionsTab({ address, transactions, page, nextCursor }: { address: string; transactions: Transaction[]; page: number; nextCursor?: string | null }) {
  const { t } = useTranslation();

  const csvData = useMemo(() =>
    transactions.map((tx) => ({
      hash: tx.hash,
      block: tx.block_height,
      from: tx.from_address,
      to: tx.to_address ?? '',
      value: formatWeiToQfc(tx.value),
      status: tx.status,
    })),
    [transactions]
  );

  const csvColumns = useMemo(() => [
    { key: 'hash', label: t('common.hash') },
    { key: 'block', label: t('common.block') },
    { key: 'from', label: t('common.from') },
    { key: 'to', label: t('common.to') },
    { key: 'value', label: t('common.value') },
    { key: 'status', label: t('common.status') },
  ], [t]);

  if (transactions.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">{t('address.noTxFound')}</p>;
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <CsvExport data={csvData} filename={`qfc_${address.slice(0, 10)}_txs`} columns={csvColumns} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2">{t('txs.txHash')}</th>
              <th className="px-3 py-2">{t('common.block')}</th>
              <th className="px-3 py-2">{t('address.direction')}</th>
              <th className="px-3 py-2">{t('common.from')}</th>
              <th className="px-3 py-2">{t('common.to')}</th>
              <th className="px-3 py-2 text-right">{t('common.value')}</th>
              <th className="px-3 py-2">{t('common.status')}</th>
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
                      <span className="text-emerald-400">{t('common.contractCreation')}</span>
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
      <Pagination address={address} tab="transactions" page={page} hasMore={transactions.length === 25} nextCursor={nextCursor} />
    </>
  );
}

function TokenTransfersTab({ address, transfers, page, nextCursor }: { address: string; transfers: TokenTransfer[]; page: number; nextCursor?: string | null }) {
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');
  const { t } = useTranslation();

  const filtered = useMemo(() => {
    if (filter === 'all') return transfers;
    if (filter === 'in') return transfers.filter((t) => t.to_address.toLowerCase() === address.toLowerCase());
    return transfers.filter((t) => t.from_address.toLowerCase() === address.toLowerCase());
  }, [transfers, filter, address]);

  if (transfers.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">{t('address.noTokenTransfers')}</p>;
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
            {f === 'all' ? t('common.all') : f === 'in' ? t('common.incoming') : t('common.outgoing')}
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
              <th className="px-3 py-2">{t('txs.txHash')}</th>
              <th className="px-3 py-2">{t('common.block')}</th>
              <th className="px-3 py-2">{t('common.from')}</th>
              <th className="px-3 py-2">{t('common.to')}</th>
              <th className="px-3 py-2 text-right">{t('common.value')}</th>
              <th className="px-3 py-2">{t('address.token')}</th>
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
      <Pagination address={address} tab="token_transfers" page={page} hasMore={transfers.length === 25} nextCursor={nextCursor} />
    </>
  );
}

function TokenHoldingsTab({ holdings }: { holdings: TokenHolding[] }) {
  const { t } = useTranslation();

  if (holdings.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">{t('address.noTokenHoldings')}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">{t('address.token')}</th>
            <th className="px-3 py-2">{t('common.contract')}</th>
            <th className="px-3 py-2 text-right">{t('common.balance')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {holdings.map((h, i) => (
            <tr key={h.token_address} className="hover:bg-slate-900/40">
              <td className="px-3 py-2.5 text-slate-500">{i + 1}</td>
              <td className="px-3 py-2.5">
                <Link href={`/token/${h.token_address}`} className="group">
                  <span className="font-medium text-white group-hover:text-cyan-300">
                    {h.token_name ?? t('common.unknown')}
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
  const { t } = useTranslation();

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
    return <p className="py-8 text-center text-sm text-slate-500">{t('address.noNftHoldings')}</p>;
  }

  return (
    <div>
      {/* View toggle */}
      <div className="mb-4 flex justify-end gap-1">
        <button
          onClick={() => setView('grid')}
          className={`rounded-lg p-2 transition-colors ${view === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
          title={t('address.gridView')}
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z" />
          </svg>
        </button>
        <button
          onClick={() => setView('list')}
          className={`rounded-lg p-2 transition-colors ${view === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
          title={t('address.listView')}
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
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
                    {t('address.tokenId')}: <span className="font-mono">{h.token_id.length > 8 ? `${h.token_id.slice(0, 8)}...` : h.token_id}</span>
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
                <th className="px-3 py-2">{t('address.collection')}</th>
                <th className="px-3 py-2">{t('address.tokenId')}</th>
                <th className="px-3 py-2">{t('common.type')}</th>
                <th className="px-3 py-2 text-right">{t('common.balance')}</th>
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
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">{t('common.verified')}</p>
            <p className="mt-1 text-sm">
              {contract.is_verified ? (
                <span className="text-emerald-400">{t('common.yes')}</span>
              ) : (
                <span className="text-slate-400">{t('common.no')}</span>
              )}
            </p>
          </div>
          {contract.creator_tx_hash && (
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">{t('contract.creatorTx')}</p>
              <p className="mt-1 text-sm">
                <Link href={`/txs/${contract.creator_tx_hash}`} className="text-cyan-400 hover:text-cyan-300">
                  {shortenHash(contract.creator_tx_hash)}
                </Link>
              </p>
            </div>
          )}
          {contract.created_at_block && (
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">{t('contract.createdAtBlock')}</p>
              <p className="mt-1 text-sm">
                <Link href={`/blocks/${contract.created_at_block}`} className="text-slate-300 hover:text-white">
                  {contract.created_at_block}
                </Link>
              </p>
            </div>
          )}
          {contract.code_hash && (
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">{t('contract.codeHash')}</p>
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
          {t('contract.viewFullPage')}
        </Link>
      </div>
    </div>
  );
}

function ExportModalTrigger({ address, type }: { address: string; type: 'transactions' | 'token_transfers' }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="mt-3 flex justify-end">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200 hover:bg-slate-800 transition-colors"
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {t('export.exportBtn')}
      </button>
      {open && (
        <AddressExportModal
          address={address}
          type={type}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function Pagination({ address, tab, page, hasMore, nextCursor }: { address: string; tab: string; page: number; hasMore: boolean; nextCursor?: string | null }) {
  const { t } = useTranslation();

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
      {page > 1 ? (
        <Link
          href={`/address/${address}?tab=${tab}&page=${page - 1}`}
          className="rounded-lg border border-slate-800 px-4 py-2 hover:bg-slate-900 transition-colors"
        >
          {t('common.previous')}
        </Link>
      ) : (
        <span className="rounded-lg border border-slate-800/40 px-4 py-2 text-slate-600">{t('common.previous')}</span>
      )}
      <span>{t('common.page')} {page}</span>
      {nextCursor ? (
        <Link
          href={`/address/${address}?tab=${tab}&cursor=${encodeURIComponent(nextCursor)}`}
          className="rounded-lg border border-slate-800 px-4 py-2 hover:bg-slate-900 transition-colors"
        >
          {t('common.next')}
        </Link>
      ) : hasMore ? (
        <Link
          href={`/address/${address}?tab=${tab}&page=${page + 1}`}
          className="rounded-lg border border-slate-800 px-4 py-2 hover:bg-slate-900 transition-colors"
        >
          {t('common.next')}
        </Link>
      ) : (
        <span className="rounded-lg border border-slate-800/40 px-4 py-2 text-slate-600">{t('common.next')}</span>
      )}
    </div>
  );
}
