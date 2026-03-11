export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiAgentSessionKeys, ApiSessionKeyInfo } from '@/lib/api-types';
import { shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import AutoRefresh from '@/components/AutoRefresh';

export async function generateMetadata({
  params,
}: {
  params: { agentId: string };
}): Promise<Metadata> {
  const id = decodeURIComponent(params.agentId);
  return {
    title: `Session Keys — ${id}`,
    description: `Manage session keys for agent "${id}".`,
  };
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    valid: 'bg-emerald-500/20 text-emerald-400',
    expired: 'bg-slate-500/20 text-slate-400',
    revoked: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-500/20 text-slate-400'}`}>
      {status}
    </span>
  );
}

function TTLCountdown({ expiresAt }: { expiresAt: string }) {
  const expMs = Number(expiresAt) * 1000;
  if (!Number.isFinite(expMs) || expMs === 0) return <span className="text-slate-500">--</span>;
  const now = Date.now();
  const diff = expMs - now;
  if (diff <= 0) return <span className="text-red-400">Expired</span>;

  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return <span className="text-emerald-400">{days}d {hours % 24}h</span>;
  }
  if (hours > 0) return <span className="text-amber-400">{hours}h {mins}m</span>;
  return <span className="text-red-400">{mins}m</span>;
}

function formatTimestamp(epochSec: string): string {
  const ms = Number(epochSec) * 1000;
  if (!Number.isFinite(ms) || ms === 0) return '--';
  return new Date(ms).toLocaleString('en-US', { hour12: false });
}

export default async function AgentKeysPage({
  params,
}: {
  params: { agentId: string };
}) {
  const agentId = decodeURIComponent(params.agentId);

  const response = await fetchJsonSafe<ApiAgentSessionKeys>(
    `/api/agents/${encodeURIComponent(agentId)}/session-keys`,
    { next: { revalidate: 15 } }
  );

  const keys = response?.data.items ?? [];
  const total = response?.data.total ?? 0;
  const validCount = keys.filter(k => k.status === 'valid').length;
  const expiredCount = keys.filter(k => k.status === 'expired').length;
  const revokedCount = keys.filter(k => k.status === 'revoked').length;

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      <AutoRefresh intervalMs={15000} />
      <SectionHeader
        title={`Session Keys: ${agentId}`}
        description={`Manage session keys for this agent — view active keys, permissions, usage, and revocation status.`}
        action={
          <Link
            href={`/agent/${encodeURIComponent(agentId)}`}
            className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200"
          >
            Back to Agent
          </Link>
        }
      />

      {/* Stats row */}
      <section className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-500">Valid</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{validCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Expired</p>
          <p className="mt-1 text-2xl font-bold text-slate-400">{expiredCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-red-500">Revoked</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{revokedCount}</p>
        </div>
      </section>

      {/* Keys table */}
      <Table<ApiSessionKeyInfo>
        rows={keys}
        keyField="keyAddress"
        emptyMessage="No session keys found for this agent."
        columns={[
          {
            key: 'keyAddress',
            header: 'Key Address',
            render: (row) => (
              <Link
                href={`/address/${row.keyAddress}`}
                className="font-mono text-sm text-slate-800 dark:text-slate-200 hover:text-cyan-400 transition-colors"
              >
                {shortenHash(row.keyAddress)}
              </Link>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: 'expiresAt',
            header: 'TTL',
            render: (row) => <TTLCountdown expiresAt={row.expiresAt} />,
          },
          {
            key: 'permissions',
            header: 'Permissions',
            render: (row) => (
              <div className="flex flex-wrap gap-1">
                {row.permissionLabels.map((perm, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-400"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            ),
          },
          {
            key: 'lastActivityAt',
            header: 'Last Activity',
            render: (row) => (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {row.lastActivityAt ? formatTimestamp(row.lastActivityAt) : 'Never'}
              </span>
            ),
          },
          {
            key: 'createdAt',
            header: 'Created',
            render: (row) => (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {formatTimestamp(row.createdAt)}
              </span>
            ),
          },
          {
            key: 'expiresAt2',
            header: 'Expires',
            render: (row) => (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {formatTimestamp(row.expiresAt)}
              </span>
            ),
          },
        ]}
      />
    </main>
  );
}
