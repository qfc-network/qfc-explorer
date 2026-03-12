export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiAgentDetail } from '@/lib/api-types';
import { shortenHash, formatWeiToQfc } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import AddressTag from '@/components/AddressTag';
import CopyButton from '@/components/CopyButton';

export async function generateMetadata({
  params,
}: {
  params: { agentId: string };
}): Promise<Metadata> {
  const id = decodeURIComponent(params.agentId);
  return {
    title: `Agent ${id}`,
    description: `Details for AI agent "${id}" on the QFC network.`,
  };
}

function formatTimestamp(epochSec: string): string {
  const ms = Number(epochSec) * 1000;
  if (!Number.isFinite(ms) || ms === 0) return '--';
  return new Date(ms).toLocaleString('en-US', { hour12: false });
}

function InfoCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <div className="mt-2 text-sm text-slate-900 dark:text-white break-all">
        {children}
      </div>
    </div>
  );
}

export default async function AgentDetailPage({
  params,
}: {
  params: { agentId: string };
}) {
  const agentId = decodeURIComponent(params.agentId);

  const response = await fetchJsonSafe<ApiAgentDetail>(
    `/api/agents/${encodeURIComponent(agentId)}`,
    { next: { revalidate: 15 } }
  );

  const agent = response?.data ?? null;

  if (!agent) {
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Agent not found
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            No agent registered with ID &ldquo;{agentId}&rdquo;.
          </p>
          <Link
            href="/agents"
            className="mt-6 inline-block rounded-full border border-slate-300 dark:border-slate-700 px-6 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Back to Agents
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      <SectionHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span>Agent: {agent.agentId}</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                agent.active
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {agent.active ? 'Active' : 'Revoked'}
            </span>
          </span>
        }
        description={
          <span className="flex items-center gap-2">
            <span className="font-mono text-xs">{agent.agentId}</span>
            <CopyButton value={agent.agentId} />
          </span>
        }
        action={
          <Link
            href="/agents"
            className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200"
          >
            Back to Agents
          </Link>
        }
      />

      {/* Agent info cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard label="Owner">
          <AddressTag address={agent.owner} shorten={false} />
        </InfoCard>

        <InfoCard label="Agent Address">
          <AddressTag address={agent.agentAddress} shorten={false} />
        </InfoCard>

        <InfoCard label="Deposit">
          {formatWeiToQfc(agent.deposit)} QFC
        </InfoCard>

        <InfoCard label="Daily Limit">
          {formatWeiToQfc(agent.dailyLimit)} QFC
        </InfoCard>

        <InfoCard label="Max Per Transaction">
          {formatWeiToQfc(agent.maxPerTx)} QFC
        </InfoCard>

        <InfoCard label="Spent Today">
          {formatWeiToQfc(agent.spentToday)} QFC
        </InfoCard>

        <InfoCard label="Permissions">
          {agent.permissionLabels.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {agent.permissionLabels.map((perm, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-400"
                >
                  {perm}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-400">None</span>
          )}
        </InfoCard>

        <InfoCard label="Registered">
          {formatTimestamp(agent.registeredAt)}
        </InfoCard>

        <InfoCard label="Status">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              agent.active
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {agent.active ? 'Active' : 'Revoked'}
          </span>
        </InfoCard>
      </div>

      {/* Quick links */}
      <section className="flex flex-wrap gap-3">
        <Link
          href={`/address/${agent.owner}`}
          className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          View Owner Account
        </Link>
        <Link
          href={`/address/${agent.agentAddress}`}
          className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          View Agent Address
        </Link>
        <Link
          href={`/agents/${encodeURIComponent(agent.agentId)}/keys`}
          className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Manage Keys
        </Link>
        <Link
          href={`/agents/sessions?agent=${encodeURIComponent(agent.agentId)}`}
          className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Session Keys Monitor
        </Link>
        <Link
          href={`/agents/risk?agent=${encodeURIComponent(agent.agentId)}`}
          className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Risk Dashboard
        </Link>
      </section>
    </main>
  );
}
