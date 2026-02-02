export const dynamic = "force-dynamic";

import Link from 'next/link';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import AdminControls from '@/components/AdminControls';
import RateLimitDashboard from '@/components/RateLimitDashboard';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiOk } from '@/lib/api-types';

export default async function AdminPage() {
  const [response, dbResponse, rateLimitResponse] = await Promise.all([
    fetchJsonSafe<ApiOk<{ items: Array<{ key: string; value: string; updated_at: string }>; lastBatch: any; failed: any }>>(
      '/api/admin/indexer',
      { next: { revalidate: 5 } }
    ),
    fetchJsonSafe<ApiOk<{ pool: { total: number; idle: number; waiting: number } }>>(
      '/api/admin/db',
      { next: { revalidate: 5 } }
    ),
    fetchJsonSafe<ApiOk<{
      config: { windowMs: number; maxRequests: number; windowSeconds: number };
      stats: { activeIps: number; totalRequests: number; limitedRequests: number; limitedPercentage: string };
      topIps: Array<{ ip: string; requests: number; limited: boolean; resetAt: number }>;
      recentRequests: Array<{ ip: string; path: string; timestamp: number; limited: boolean }>;
    }>>(
      '/api/admin/rate-limit',
      { next: { revalidate: 5 } }
    ),
  ]);

  const items = response?.data.items ?? [];
  const lastBatch = response?.data.lastBatch ?? null;
  const failed = response?.data.failed ?? null;
  const poolStats = dbResponse?.data.pool ?? null;
  const rateLimit = rateLimitResponse?.data ?? null;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="text-slate-500 hover:text-slate-300">Home</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300">Admin</span>
        </div>
        <h1 className="text-3xl font-semibold text-white">Admin Dashboard</h1>
        <p className="text-slate-400">System monitoring and controls</p>
      </header>

      {/* Quick Stats */}
      <section className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label="DB Pool"
          value={poolStats ? `${poolStats.idle}/${poolStats.total}` : '—'}
          sub="idle/total"
          color="blue"
        />
        <StatCard
          label="Active IPs"
          value={rateLimit?.stats.activeIps?.toString() ?? '—'}
          sub="in current window"
          color="green"
        />
        <StatCard
          label="Requests/min"
          value={rateLimit?.stats.totalRequests?.toString() ?? '—'}
          sub="last minute"
          color="yellow"
        />
        <StatCard
          label="Rate Limited"
          value={rateLimit?.stats.limitedPercentage ?? '0'}
          sub="% of requests"
          color={Number(rateLimit?.stats.limitedPercentage ?? 0) > 5 ? 'red' : 'green'}
        />
      </section>

      {/* Indexer Status */}
      <section className="space-y-4">
        <SectionHeader title="Indexer Status" description="Block indexer state and batch info" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Last Batch</p>
            <pre className="whitespace-pre-wrap text-xs font-mono bg-slate-800 rounded p-3 max-h-40 overflow-auto">
              {lastBatch ? JSON.stringify(lastBatch, null, 2) : 'No batch data'}
            </pre>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Last Failure</p>
            <pre className="whitespace-pre-wrap text-xs font-mono bg-slate-800 rounded p-3 max-h-40 overflow-auto">
              {failed ? JSON.stringify(failed, null, 2) : 'No failures'}
            </pre>
          </div>
        </div>
      </section>

      {/* Admin Controls */}
      <section className="space-y-4">
        <SectionHeader title="Controls" description="Indexer management actions" />
        <AdminControls />
      </section>

      {/* Rate Limit Dashboard */}
      <section className="space-y-4">
        <SectionHeader
          title="API Rate Limiting"
          description={`${rateLimit?.config.maxRequests ?? 100} requests per ${(rateLimit?.config.windowSeconds ?? 60)} seconds per IP`}
        />
        <RateLimitDashboard
          topIps={rateLimit?.topIps ?? []}
          recentRequests={rateLimit?.recentRequests ?? []}
        />
      </section>

      {/* Indexer State Table */}
      <section className="space-y-4">
        <SectionHeader title="Indexer State" description="Key-value state storage" />
        <Table
          rows={items}
          emptyMessage="No indexer state found."
          columns={[
            { key: 'key', header: 'Key', render: (row) => <span className="font-mono">{row.key}</span> },
            { key: 'value', header: 'Value', render: (row) => <span className="font-mono text-slate-400">{row.value}</span> },
            { key: 'updated_at', header: 'Updated', render: (row) => row.updated_at },
          ]}
        />
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  color = 'blue',
}: {
  label: string;
  value: string;
  sub?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}) {
  const colorClasses = {
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    green: 'border-green-500/30 bg-green-500/10 text-green-400',
    yellow: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    red: 'border-red-500/30 bg-red-500/10 text-red-400',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <p className="text-xs uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-50 mt-1">{sub}</p>}
    </div>
  );
}
