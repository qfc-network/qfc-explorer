export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiAgentRiskDashboard } from '@/lib/api-types';
import { shortenHash, formatWeiToQfc } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import TranslatedText from '@/components/TranslatedText';
import AutoRefresh from '@/components/AutoRefresh';

export const metadata: Metadata = {
  title: 'Agent Risk Dashboard',
  description: 'Operator dashboard for AI agent wallet risk posture — daily spend, limits, violations.',
  openGraph: {
    title: 'Agent Risk Dashboard | QFC Explorer',
    description: 'Monitor AI agent risk posture on the QFC network.',
    type: 'website',
  },
};

function ProgressBar({ current, max, label }: { current: bigint; max: bigint; label: string }) {
  const pct = max > 0n ? Number((current * 100n) / max) : 0;
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        <span className="font-mono text-slate-700 dark:text-slate-300">
          {formatWeiToQfc(current.toString())} / {formatWeiToQfc(max.toString())} QFC
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-300`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <div className="mt-1 text-right text-[10px] text-slate-400">
        {pct}%
      </div>
    </div>
  );
}

function ViolationRow({ violation }: { violation: { txHash: string; agentId: string; reason: string; timestamp: string; amount: string } }) {
  const ts = Number(violation.timestamp) * 1000;
  const dateStr = Number.isFinite(ts) && ts > 0
    ? new Date(ts).toLocaleString('en-US', { hour12: false })
    : '--';

  return (
    <div className="flex items-start gap-4 border-b border-slate-100 dark:border-slate-800/60 px-4 py-3 last:border-b-0">
      <div className="flex-shrink-0 mt-0.5">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-red-600 dark:text-red-400">{violation.reason}</span>
          <span className="text-xs text-slate-400">{dateStr}</span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>Agent: <Link href={`/agent/${encodeURIComponent(violation.agentId)}`} className="text-cyan-500 hover:text-cyan-400">{violation.agentId.length > 16 ? violation.agentId.slice(0, 16) + '…' : violation.agentId}</Link></span>
          {violation.txHash && (
            <span>Tx: <Link href={`/tx/${violation.txHash}`} className="font-mono text-cyan-500 hover:text-cyan-400">{shortenHash(violation.txHash)}</Link></span>
          )}
          {violation.amount !== '0' && (
            <span>Amount: {formatWeiToQfc(violation.amount)} QFC</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function RiskDashboardPage({
  searchParams,
}: {
  searchParams: { owner?: string; agent?: string; status?: string };
}) {
  const owner = searchParams.owner ?? '';
  const agent = searchParams.agent ?? '';
  const status = searchParams.status ?? '';

  const params = new URLSearchParams();
  if (owner) params.set('owner', owner);
  if (agent) params.set('agent', agent);
  if (status) params.set('status', status);

  const response = await fetchJsonSafe<ApiAgentRiskDashboard>(
    `/api/agents/risk?${params}`,
    { next: { revalidate: 15 } }
  );

  const data = response?.data ?? null;
  const agents = data?.agents ?? [];
  const violations = data?.violations ?? [];
  const stats = data?.stats ?? { totalAgents: 0, activeAgents: 0, totalViolations: 0, totalRejections: 0 };

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      <AutoRefresh intervalMs={15000} />
      <SectionHeader
        title={<TranslatedText tKey="risk.title" />}
        description={<TranslatedText tKey="risk.description" />}
        action={
          <Link
            href="/agents"
            className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200"
          >
            <TranslatedText tKey="agents.backToList" />
          </Link>
        }
      />

      {/* Summary stats */}
      <section className="grid gap-4 sm:grid-cols-4">
        <StatsCard
          label={<TranslatedText tKey="risk.totalAgents" />}
          value={String(stats.totalAgents)}
        />
        <StatsCard
          label={<TranslatedText tKey="risk.activeAgents" />}
          value={String(stats.activeAgents)}
        />
        <StatsCard
          label={<TranslatedText tKey="risk.totalViolations" />}
          value={String(stats.totalViolations)}
        />
        <StatsCard
          label={<TranslatedText tKey="risk.totalRejections" />}
          value={String(stats.totalRejections)}
        />
      </section>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['', 'active', 'revoked'].map((s) => {
          const isActive = status === s;
          const label = s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1);
          const href = s ? `/agents/risk?status=${s}` : '/agents/risk';
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

      {/* Agent risk cards */}
      <section className="grid gap-4 lg:grid-cols-2">
        {agents.length === 0 ? (
          <div className="col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No agent risk data available.
            </p>
          </div>
        ) : (
          agents.map((ag) => {
            let spentToday: bigint;
            let dailyLimit: bigint;
            let maxPerTx: bigint;
            try { spentToday = BigInt(ag.spentToday); } catch { spentToday = 0n; }
            try { dailyLimit = BigInt(ag.dailyLimit); } catch { dailyLimit = 0n; }
            try { maxPerTx = BigInt(ag.maxPerTx); } catch { maxPerTx = 0n; }

            return (
              <div
                key={ag.agentId}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link
                      href={`/agent/${encodeURIComponent(ag.agentId)}`}
                      className="text-sm font-medium text-slate-900 dark:text-white hover:text-cyan-400 transition-colors truncate"
                    >
                      {ag.agentId}
                    </Link>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        ag.active
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/20 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {ag.active ? 'Active' : 'Revoked'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {ag.violationCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-red-500">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                        </svg>
                        {ag.violationCount} violations
                      </span>
                    )}
                    {ag.rejectionCount > 0 && (
                      <span className="text-amber-500">{ag.rejectionCount} rejected</span>
                    )}
                  </div>
                </div>

                {/* Owner */}
                <div className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                  Owner: <Link href={`/address/${ag.owner}`} className="font-mono text-cyan-500 hover:text-cyan-400">{shortenHash(ag.owner)}</Link>
                </div>

                {/* Daily spend progress */}
                <div className="space-y-3">
                  <ProgressBar
                    current={spentToday}
                    max={dailyLimit}
                    label="Daily Spend"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Max Per Tx</span>
                    <span className="font-mono">{formatWeiToQfc(maxPerTx.toString())} QFC</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Violations feed */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          <TranslatedText tKey="risk.recentViolations" />
        </h3>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden">
          {violations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-3">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No violations recorded. All agents operating within limits.
              </p>
            </div>
          ) : (
            violations.map((v, i) => <ViolationRow key={i} violation={v} />)
          )}
        </div>
      </section>
    </main>
  );
}
