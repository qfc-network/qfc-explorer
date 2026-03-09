export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inference Tasks',
  description: 'Recent AI inference tasks on the QFC blockchain.',
  openGraph: {
    title: 'Inference Tasks | QFC Explorer',
    description: 'Recent AI inference tasks on the QFC blockchain.',
    type: 'website',
  },
};

import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiInferenceTasksList } from '@/lib/api-types';
import InferenceTasksPageClient from '@/components/InferenceTasksPageClient';

const PAGE_SIZE = 25;

export default async function InferenceTasksPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const status = searchParams.status || undefined;

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  if (status) queryParams.set('status', status);

  const response = await fetchJsonSafe<ApiInferenceTasksList>(
    `/api/inference/tasks?${queryParams}`,
    { next: { revalidate: 10 } }
  );

  const items = response?.data.items ?? [];
  const stats = response?.data.stats ?? null;
  const total = response?.data.total ?? 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <InferenceTasksPageClient
        tasks={items}
        stats={stats}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        statusFilter={status ?? null}
      />
    </main>
  );
}
