export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import NftsPageClient from '@/components/NftsPageClient';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiTokensList } from '@/lib/api-types';

type NftCollection = ApiTokensList['data']['items'][number] & {
  holder_count?: number | null;
};

export const metadata: Metadata = {
  title: 'NFTs',
  description: 'ERC-721 and ERC-1155 collections on the QFC blockchain.',
  openGraph: {
    title: 'NFTs | QFC Explorer',
    description: 'ERC-721 and ERC-1155 collections on the QFC blockchain.',
    type: 'website',
  },
};

const PAGE_SIZE = 12;

export default async function NftsPage() {
  const [erc721Response, erc1155Response] = await Promise.all([
    fetchJsonSafe<ApiTokensList>(`/api/tokens?page=1&limit=${PAGE_SIZE}&sort=holders&type=erc721`, {
      next: { revalidate: 30 },
    }),
    fetchJsonSafe<ApiTokensList>(`/api/tokens?page=1&limit=${PAGE_SIZE}&sort=holders&type=erc1155`, {
      next: { revalidate: 30 },
    }),
  ]);

  const erc721Collections = (erc721Response?.data.items ?? []) as NftCollection[];
  const erc1155Collections = (erc1155Response?.data.items ?? []) as NftCollection[];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <NftsPageClient erc721Collections={erc721Collections} erc1155Collections={erc1155Collections} />
    </main>
  );
}
