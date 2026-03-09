export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tokens',
  description: 'ERC-20 and NFT tokens on the QFC blockchain.',
  openGraph: {
    title: 'Tokens | QFC Explorer',
    description: 'ERC-20 and NFT tokens on the QFC blockchain.',
    type: 'website',
  },
};

import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiTokensList } from '@/lib/api-types';
import TokensPageClient from '@/components/TokensPageClient';

const PAGE_SIZE = 25;

export default async function TokensPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const response = await fetchJsonSafe<ApiTokensList>(
    `/api/tokens?page=${page}&limit=${PAGE_SIZE}`,
    { next: { revalidate: 20 } }
  );
  const tokens = response?.data.items ?? [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <TokensPageClient tokens={tokens} page={page} pageSize={PAGE_SIZE} />
    </main>
  );
}
