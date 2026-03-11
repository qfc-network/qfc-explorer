export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiAgentsList, ApiAgentInfo } from '@/lib/api-types';
import { formatNumber, shortenHash, formatWeiToQfc } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import Table from '@/components/Table';
import TranslatedText from '@/components/TranslatedText';
import AutoRefresh from '@/components/AutoRefresh';

export const metadata: Metadata = {
  title: 'AI Agents',
  description: 'Registered AI agents on the QFC network.',
  openGraph: {
    title: 'AI Agents | QFC Explorer',
    description: 'Registered AI agents on the QFC network.',
    type: 'website',
  },
};

function formatTimestamp(epochSec: string): string {
  const ms = Number(epochSec) * 1000;
  if (!Number.isFinite(ms) || ms === 0) return '--';
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function AgentsPage() {
  const response = await fetchJsonSafe<ApiAgentsList>('/api/agents', {
    next: { revalidate: 30 },
  });

  const agents = response?.data.items ?? [];
  const total = response?.data.total ?? 0;
  const activeCount = agents.filter((a) => a.active).length;

  // Sum deposits
  let totalDeposit = 0n;
  for (const a of agents) {
    try { totalDeposit += BigInt(a.deposit); } catch { /* skip */ }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      <AutoRefresh intervalMs={30000} />
      <SectionHeader
        title={<TranslatedText tKey="agents.title" />}
        description={<TranslatedText tKey="agents.description" />}
      />

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          label={<TranslatedText tKey="agents.totalAgents" />}
          value={formatNumber(total)}
        />
        <StatsCard
          label={<TranslatedText tKey="agents.activeAgents" />}
          value={formatNumber(activeCount)}
        />
        <StatsCard
          label={<TranslatedText tKey="agents.totalDeposit" />}
          value={`${formatWeiToQfc(totalDeposit.toString())} QFC`}
        />
      </section>

      {/* Agents table */}
      <Table<ApiAgentInfo>
        rows={agents}
        keyField="agentId"
        emptyMessage="No agents registered yet."
        columns={[
          {
            key: 'agentId',
            header: 'Agent ID',
            render: (row) => (
              <Link
                href={`/agent/${encodeURIComponent(row.agentId)}`}
                className="font-mono text-sm text-slate-800 dark:text-slate-200 hover:text-cyan-400 transition-colors"
              >
                {row.agentId}
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
            key: 'agentAddress',
            header: 'Agent Address',
            render: (row) => (
              <Link
                href={`/address/${row.agentAddress}`}
                className="font-mono text-sm text-slate-600 dark:text-slate-300 hover:text-cyan-400 transition-colors"
              >
                {shortenHash(row.agentAddress)}
              </Link>
            ),
          },
          {
            key: 'deposit',
            header: 'Deposit',
            render: (row) => (
              <span className="font-mono text-sm text-slate-600 dark:text-slate-300">
                {formatWeiToQfc(row.deposit)} QFC
              </span>
            ),
          },
          {
            key: 'active',
            header: 'Status',
            render: (row) => (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  row.active
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {row.active ? 'Active' : 'Revoked'}
              </span>
            ),
          },
          {
            key: 'registeredAt',
            header: 'Registered',
            render: (row) => (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {formatTimestamp(row.registeredAt)}
              </span>
            ),
          },
        ]}
      />
    </main>
  );
}
