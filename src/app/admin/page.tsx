import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import AdminControls from '@/components/AdminControls';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiOk } from '@/lib/api-types';

export default async function AdminPage() {
  const [response, dbResponse] = await Promise.all([
    fetchJsonSafe<ApiOk<{ items: Array<{ key: string; value: string; updated_at: string }>; lastBatch: any; failed: any }>>(
      '/api/admin/indexer',
      { next: { revalidate: 5 } }
    ),
    fetchJsonSafe<ApiOk<{ pool: { total: number; idle: number; waiting: number } }>>(
      '/api/admin/db',
      { next: { revalidate: 5 } }
    ),
  ]);

  const items = response?.data.items ?? [];
  const lastBatch = response?.data.lastBatch ?? null;
  const failed = response?.data.failed ?? null;
  const poolStats = dbResponse?.data.pool ?? null;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <SectionHeader title="Admin" description="Indexer state & health" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Last Batch</p>
          <pre className="mt-3 whitespace-pre-wrap text-xs">{lastBatch ? JSON.stringify(lastBatch, null, 2) : '—'}</pre>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Last Failure</p>
          <pre className="mt-3 whitespace-pre-wrap text-xs">{failed ? JSON.stringify(failed, null, 2) : '—'}</pre>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">DB Pool</p>
        <p className="mt-3 text-sm">
          {poolStats ? `total=${poolStats.total} idle=${poolStats.idle} waiting=${poolStats.waiting}` : '—'}
        </p>
      </div>

      <AdminControls />

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
