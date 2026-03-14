'use client';

import Link from 'next/link';
import { useTranslation } from '@/components/LocaleProvider';
import { shortenHash } from '@/lib/format';

type NftCollection = {
  address: string;
  name: string | null;
  symbol: string | null;
  total_supply: string | null;
  token_type: string;
  holder_count?: number | null;
};

type Props = {
  erc721Collections: NftCollection[];
  erc1155Collections: NftCollection[];
};

function formatItemCount(totalSupply: string | null): string {
  if (!totalSupply) return '—';
  try {
    return BigInt(totalSupply).toLocaleString('en-US');
  } catch {
    return totalSupply;
  }
}

function CollectionTable({ title, collections }: { title: string; collections: NftCollection[] }) {
  const { t } = useTranslation();

  return (
    <section className="rounded-xl border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40 overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800/60">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800/60 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">{t('nfts.collection')}</th>
              <th className="px-4 py-3">{t('tokens.contract')}</th>
              <th className="px-4 py-3 text-right">{t('nfts.items')}</th>
              <th className="px-4 py-3 text-right">{t('nfts.holders')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
            {collections.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  {t('nfts.noCollections')}
                </td>
              </tr>
            ) : (
              collections.map((collection, index) => (
                <tr key={collection.address} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/token/${collection.address}?tab=inventory&page=1`} className="group">
                      <span className="font-medium text-slate-900 dark:text-white group-hover:text-cyan-300">
                        {collection.name ?? t('common.unknown')}
                      </span>
                      {collection.symbol && (
                        <span className="ml-2 text-xs text-slate-400">({collection.symbol})</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/address/${collection.address}`} className="font-mono text-xs text-cyan-400 hover:text-cyan-300">
                      {shortenHash(collection.address)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                    {formatItemCount(collection.total_supply)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                    {collection.holder_count?.toLocaleString('en-US') ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function NftsPageClient({ erc721Collections, erc1155Collections }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{t('nfts.title')}</h1>
        <p className="mt-1 text-sm text-slate-400">{t('nfts.description')}</p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <CollectionTable title={t('nfts.erc721')} collections={erc721Collections} />
        <CollectionTable title={t('nfts.erc1155')} collections={erc1155Collections} />
      </div>
    </>
  );
}
