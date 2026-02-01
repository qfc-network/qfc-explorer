import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiOk } from '@/lib/api-types';

export default async function AdminPage() {
  const response = await fetchJsonSafe<ApiOk<{ items: Array<{ key: string; value: string; updated_at: string }> }>>(
    '/api/admin/indexer',
    { next: { revalidate: 5 } }
  );

  const items = response?.data.items ?? [];

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <SectionHeader title="Admin" description="Indexer state & health" />

      <Table
        rows={items}
        emptyMessage="No indexer state found."
        columns={[
          { key: 'key', header: 'Key', render: (row) => row.key },
          { key: 'value', header: 'Value', render: (row) => row.value },
          { key: 'updated_at', header: 'Updated', render: (row) => row.updated_at },
        ]}
      />
    </main>
  );
}
