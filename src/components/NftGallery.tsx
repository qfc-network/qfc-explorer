'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { NftGalleryItem } from '@/lib/api-types';
import { shortenHash } from '@/lib/format';
import { getApiBaseUrl } from '@/lib/api-client';

type NftGalleryProps = {
  tokenAddress: string;
  initialItems: NftGalleryItem[];
  total: number;
  initialPage: number;
  limit: number;
  tokenType?: string;
};

export default function NftGallery({
  tokenAddress,
  initialItems,
  total,
  initialPage,
  limit,
  tokenType,
}: NftGalleryProps) {
  const [items, setItems] = useState<NftGalleryItem[]>(initialItems);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);

  const hasMore = items.length < total;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const base = getApiBaseUrl();
      const isExternal =
        base.includes(':3001') ||
        (typeof window === 'undefined'
          ? ''
          : process.env.NEXT_PUBLIC_API_URL ?? ''
        ).length > 0;
      const path = isExternal
        ? `${base}/tokens/${tokenAddress}/nfts?page=${nextPage}&limit=${limit}`
        : `${base}/api/tokens/${tokenAddress}/nfts?page=${nextPage}&limit=${limit}`;

      const res = await fetch(path);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      if (json.ok && json.data?.items) {
        setItems((prev) => [...prev, ...json.data.items]);
        setPage(nextPage);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, tokenAddress, limit]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item) => (
          <NftGalleryCard
            key={`${item.token_id}-${item.owner}`}
            tokenAddress={tokenAddress}
            item={item}
            tokenType={tokenType}
          />
        ))}
      </div>

      {items.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">
          No NFTs found in this collection.
        </p>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : `Load More (${items.length} / ${total})`}
          </button>
        </div>
      )}
    </div>
  );
}

function NftGalleryCard({
  tokenAddress,
  item,
  tokenType,
}: {
  tokenAddress: string;
  item: NftGalleryItem;
  tokenType?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const displayName = item.name ?? `#${item.token_id}`;
  const shortId =
    item.token_id.length > 8
      ? `${item.token_id.slice(0, 8)}...`
      : item.token_id;
  const placeholderId =
    item.token_id.length > 4 ? item.token_id.slice(0, 4) : item.token_id;

  return (
    <div className="flex flex-col">
      <Link
        href={`/nft/${tokenAddress}/${item.token_id}`}
        className="group rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden hover:border-slate-600 transition-colors"
      >
        {/* Image or placeholder */}
        <div className="relative aspect-square bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
          {item.image && !imgError ? (
            <Image
              src={item.image}
              alt={displayName}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-3xl font-bold text-slate-700 group-hover:text-slate-600 transition-colors">
              #{placeholderId}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs font-medium text-white truncate group-hover:text-cyan-300">
            {displayName}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Token ID: <span className="font-mono">{shortId}</span>
          </p>
          <div className="mt-1.5 flex items-center justify-between">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                tokenType === 'erc721'
                  ? 'bg-purple-500/10 text-purple-400'
                  : 'bg-orange-500/10 text-orange-400'
              }`}
            >
              {tokenType === 'erc721' ? '721' : '1155'}
            </span>
            {tokenType === 'erc1155' &&
              item.balance &&
              item.balance !== '1' && (
                <span className="text-[10px] text-slate-500">
                  x{item.balance}
                </span>
              )}
          </div>
        </div>
      </Link>
      <p className="mt-1 text-center text-[10px] text-slate-500">
        Owner:{' '}
        <Link
          href={`/address/${item.owner}`}
          className="text-cyan-400 hover:text-cyan-300 font-mono"
        >
          {shortenHash(item.owner, 6, 4)}
        </Link>
      </p>
    </div>
  );
}
