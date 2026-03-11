export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiAgentDashboard, ApiAgentInfo, ApiAgentAlert, ApiSpendingPoint } from '@/lib/api-types';
import { formatNumber, shortenHash, formatWeiToQfc } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import Table from '@/components/Table';
import TranslatedText from '@/components/TranslatedText';
import AutoRefresh from '@/components/AutoRefresh';

export const metadata: Metadata = {
  title: 'Agent Dashboard',
  description: 'Operator dashboard for your AI agents — spending, alerts, and status.',
};

function AlertBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    high_spend: 'bg-amber-500/20 text-amber-400',
    limit_reached: 'bg-red-500/20 text-red-400',
    key_expiring: 'bg-yellow-500/20 text-yellow-400',
    revoked: 'bg-red-500/20 text-red-400',
  };
  const labels: Record<string, string> = {
    high_spend: 'High Spend',
    limit_reached: 'Limit Reached',
    key_expiring: 'Key Expiring',
    revoked: 'Revoked',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[type] ?? 'bg-slate-500/20 text-slate-400'}`}>
      {labels[type] ?? type}
    </span>
  );
}

function SpendBar({ spent, limit }: { spent: string; limit: string }) {
  const s = Number(spent);
  const l = Number(limit);
  if (l === 0) return <span className="text-xs text-slate-500">No limit</span>;
  const pct = Math.min((s / l) * 100, 100);
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{pct.toFixed(0)}%</span>
    </div>
  );
}

function formatTimestamp(epochSec: string): string {
  const ms = Number(epochSec) * 1000;
  if (!Number.isFinite(ms) || ms === 0) return '--';
  return new Date(ms).toLocaleString('en-US', { hour12: false });
}

export default async function AgentDashboardPage({
  searchParams,
}: {
  searchParams: { owner?: string };
}) {
  const ownerParam = searchParams.owner ? `?owner=${encodeURIComponent(searchParams.owner)}` : '';
  const response = await fetchJsonSafe<ApiAgentDashboard>(
    `/api/agents/dashboard${ownerParam}`,
    { next: { revalidate: 15 } }
  );

  const stats = response?.data.stats ?? { totalAgents: 0, activeAgents: 0, totalDeposit: '0', totalSpentToday: '0' };
  const agents = response?.data.agents ?? [];
  const alerts = response?.data.alerts ?? [];
  const spendingTrend = response?.data.spendingTrend ?? [];

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      <AutoRefresh intervalMs={15000} />
      <SectionHeader
        title={<TranslatedText tKey="dashboard.title" />}
        description={<TranslatedText tKey="dashboard.description" />}
        action={
          <Link
            href="/agents"
            className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200"
          >
            All Agents
          </Link>
        }
      />

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-4">
        <StatsCard label={<TranslatedText tKey="agents.totalAgents" />} value={formatNumber(stats.totalAgents)} />
        <StatsCard label={<TranslatedText tKey="agents.activeAgents" />} value={formatNumber(stats.activeAgents)} />
        <StatsCard label={<TranslatedText tKey="agents.totalDeposit" />} value={`${formatWeiToQfc(stats.totalDeposit)} QFC`} />
        <StatsCard label={<TranslatedText tKey="dashboard.spentToday" />} value={`${formatWeiToQfc(stats.totalSpentToday)} QFC`} />
      </section>

      {/* Alerts */}
      {alerts.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            <TranslatedText tKey="dashboard.alerts" />
          </h3>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 px-4 py-3"
              >
                <AlertBadge type={alert.type} />
                <Link
                  href={`/agent/${encodeURIComponent(alert.agentId)}`}
                  className="font-mono text-sm text-slate-700 dark:text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  {alert.agentId}
                </Link>
                <span className="flex-1 text-sm text-slate-600 dark:text-slate-400">{alert.message}</span>
                <span className="text-xs text-slate-400">{formatTimestamp(alert.timestamp)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Spending Trend */}
      {spendingTrend.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            <TranslatedText tKey="dashboard.spendingTrend" />
          </h3>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6">
            <div className="flex items-end gap-1 h-32">
              {spendingTrend.map((point, i) => {
                const maxVal = Math.max(...spendingTrend.map(p => Number(p.amount)), 1);
                const height = (Number(point.amount) / maxVal) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-cyan-500/70 min-h-[2px]"
                      style={{ height: `${height}%` }}
                      title={`${point.date}: ${formatWeiToQfc(point.amount)} QFC`}
                    />
                    <span className="text-[10px] text-slate-400 truncate w-full text-center">
                      {point.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* My Agents */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
          <TranslatedText tKey="dashboard.myAgents" />
        </h3>
        <Table<ApiAgentInfo>
          rows={agents}
          keyField="agentId"
          emptyMessage="No agents found. Connect your wallet or specify ?owner=0x..."
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
              key: 'deposit',
              header: 'Deposit',
              render: (row) => (
                <span className="font-mono text-sm text-slate-600 dark:text-slate-300">
                  {formatWeiToQfc(row.deposit)} QFC
                </span>
              ),
            },
            {
              key: 'spentToday',
              header: 'Daily Spend',
              render: (row) => <SpendBar spent={row.spentToday} limit={row.dailyLimit} />,
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
              key: 'actions',
              header: '',
              render: (row) => (
                <div className="flex gap-2">
                  <Link
                    href={`/agents/${encodeURIComponent(row.agentId)}/keys`}
                    className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
                  >
                    Keys
                  </Link>
                  <Link
                    href={`/agents/risk?agent=${encodeURIComponent(row.agentId)}`}
                    className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
                  >
                    Risk
                  </Link>
                </div>
              ),
            },
          ]}
        />
      </section>
    </main>
  );
}
