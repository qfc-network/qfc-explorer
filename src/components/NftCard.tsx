'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export type NftCardProps = {
  /** Contract address */
  tokenAddress: string;
  /** Token ID */
  tokenId: string;
  /** Collection / token name */
  collectionName?: string | null;
  /** Individual NFT name from metadata */
  nftName?: string | null;
  /** Resolved image URL (HTTP/HTTPS) */
  imageUrl?: string | null;
  /** Token type badge */
  tokenType?: string;
  /** Balance (for ERC-1155) */
  balance?: string;
};

export default function NftCard({
  tokenAddress,
  tokenId,
  collectionName,
  nftName,
  imageUrl,
  tokenType,
  balance,
}: NftCardProps) {
  const [imgError, setImgError] = useState(false);
  const displayName = nftName || collectionName || 'NFT';
  const shortId = tokenId.length > 8 ? `${tokenId.slice(0, 8)}...` : tokenId;
  const placeholderId = tokenId.length > 4 ? tokenId.slice(0, 4) : tokenId;
  const isErc1155 = tokenType === 'erc1155';

  return (
    <Link
      href={`/nft/${tokenAddress}/${tokenId}`}
      className="group rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden hover:border-slate-600 transition-colors"
    >
      {/* Image or placeholder */}
      <div className="relative aspect-square bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
        {imageUrl && !imgError ? (
          <Image
            src={imageUrl}
            alt={nftName ?? `#${tokenId}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
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
          {isErc1155 && balance && balance !== '1' && (
            <span className="text-[10px] text-slate-500">x{balance}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
