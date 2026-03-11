export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiSessionKeysList } from '@/lib/api-types';
import { shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import Table from '@/components/Table';
import TranslatedText from '@/components/TranslatedText';
import AutoRefresh from '@/components/AutoRefresh';

export const metadata: Metadata = {
  title: 'Session Keys',
  description: 'Session key monitor — view active, expired, and revoked session keys for AI agents.',
  openGraph: {
    title: 'Session Keys | QFC Explorer',
    description: 'Monitor session keys for AI agents on the QFC network.',
    type: 'website',
  },
};

type SessionKey = ApiSessionKeysList['data']['items'][number];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    valid: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    expired: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    revoked: 'bg-red-500/20 text-red-600 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-500/20 text-slate-600 dark:text-slate-400'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function TtlCountdown({ expiresAt }: { expiresAt: string }) {
  const ms = Number(expiresAt) * 1000;
  if (!Number.isFinite(ms) || ms === 0) return <span className="text-slate-400">--</span>;
  const now = Date.now();
  const remaining = ms - now;
  if (remaining <= 0) return <span className="text-amber-500 text-xs">Expired</span>;

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return <span className="text-sm font-mono text-slate-600 dark:text-slate-300">{days}d {hours % 24}h</span>;
  }
  return <span className="text-sm font-mono text-slate-600 dark:text-slate-300">{hours}h {minutes}m</span>;
}

function formatTimestamp(epochSec: string): string {
  const ms = Number(epochSec) * 1000;
  if (!Number.isFinite(ms) || ms === 0) return '--';
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default async function SessionKeysPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; owner?: string; agent?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const status = searchParams.status ?? '';
  const owner = searchParams.owner ?? '';
  const agent = searchParams.agent ?? '';

  const params = new URLSearchParams({ page: String(page), limit: '25' });
  if (status) params.set('status', status);
  if (owner) params.set('owner', owner);
  if (agent) params.set('agent', agent);

  const response = await fetchJsonSafe<ApiSessionKeysList>(
    `/api/agents/sessions?${params}`,
    { next: { revalidate: 15 } }
  );

  const items = response?.data.items ?? [];
  const total = response?.data.total ?? 0;
  const stats = response?.data.stats ?? { valid: 0, expired: 0, revoked: 0 };

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      <AutoRefresh intervalMs={15000} />
      <SectionHeader
        title={<TranslatedText tKey="sessions.title" />}
        description={<TranslatedText tKey="sessions.description" />}
        action={
          <Link
            href="/agents"
            className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200"
          >
            <TranslatedText tKey="agents.backToList" />
          </Link>
        }
      />

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-4">
        <StatsCard
          label={<TranslatedText tKey="sessions.totalKeys" />}
          value={String(total)}
        />
        <StatsCard
          label={<TranslatedText tKey="sessions.validKeys" />}
          value={String(stats.valid)}
        />
        <StatsCard
          label={<TranslatedText tKey="sessions.expiredKeys" />}
          value={String(stats.expired)}
        />
        <StatsCard
          label={<TranslatedText tKey="sessions.revokedKeys" />}
          value={String(stats.revoked)}
        />
      </section>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['', 'valid', 'expired', 'revoked'].map((s) => {
          const isActive = status === s;
          const label = s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1);
          const href = s ? `/agents/sessions?status=${s}` : '/agents/sessions';
          return (
            <Link
              key={s}
              href={href}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Session keys table */}
      <Table<SessionKey>
        rows={items}
        keyField="keyAddress"
        emptyMessage="No session keys found."
        columns={[
          {
            key: 'keyAddress',
            header: 'Session Key',
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
            key: 'agentId',
            header: 'Agent',
            render: (row) => (
              <Link
                href={`/agent/${encodeURIComponent(row.agentId)}`}
                className="font-mono text-sm text-slate-600 dark:text-slate-300 hover:text-cyan-400 transition-colors"
              >
                {row.agentId.length > 16 ? row.agentId.slice(0, 16) + '…' : row.agentId}
              </Link>
            ),
          },
          {
            key: 'owner',
            header: 'Owner',
            render: (row) => (
              <Link
                href={`/address/${row.owner}`}
                className="font-mono text-sm text-slate-600 dark:text-slate-300 hover:text-cyan-400 transition-colors"
              >
                {shortenHash(row.owner)}
              </Link>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: 'ttl',
            header: 'TTL Remaining',
            render: (row) => <TtlCountdown expiresAt={row.expiresAt} />,
          },
          {
            key: 'permissions',
            header: 'Permissions',
            render: (row) => (
              <div className="flex flex-wrap gap-1">
                {row.permissionLabels.slice(0, 3).map((p, i) => (
                  <span key={i} className="inline-flex items-center rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-600 dark:text-cyan-400">
                    {p}
                  </span>
                ))}
                {row.permissionLabels.length > 3 && (
                  <span className="text-[10px] text-slate-400">+{row.permissionLabels.length - 3}</span>
                )}
              </div>
            ),
          },
          {
            key: 'lastActivity',
            header: 'Last Activity',
            render: (row) => (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {row.lastActivityAt ? formatTimestamp(row.lastActivityAt) : '--'}
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
        ]}
      />

      {/* Pagination */}
      {total > 25 && (
        <div className="flex items-center justify-center gap-4">
          {page > 1 && (
            <Link
              href={`/agents/sessions?page=${page - 1}${status ? `&status=${status}` : ''}`}
              className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Page {page}
          </span>
          {items.length === 25 && (
            <Link
              href={`/agents/sessions?page=${page + 1}${status ? `&status=${status}` : ''}`}
              className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
