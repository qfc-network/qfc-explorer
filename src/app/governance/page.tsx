export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DAO Governance',
  description: 'QFC DAO governance — proposals, voting, and protocol decisions.',
  openGraph: {
    title: 'DAO Governance | QFC Explorer',
    description: 'QFC DAO governance — proposals, voting, and protocol decisions.',
    type: 'website',
  },
};

import Link from 'next/link';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import Table from '@/components/Table';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiGovernanceProposals, GovernanceProposal } from '@/lib/api-types';
import { shortenHash } from '@/lib/format';

function statusBadge(status: string) {
  const cls =
    status === 'Active'
      ? 'bg-blue-500/20 text-blue-300'
      : status === 'Passed'
        ? 'bg-green-500/20 text-green-300'
        : status === 'Failed'
          ? 'bg-red-500/20 text-red-300'
          : 'bg-yellow-500/20 text-yellow-300';
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function typeBadge(type: string) {
  const cls =
    type === 'Parameter Change'
      ? 'bg-purple-500/20 text-purple-300'
      : type === 'Protocol Upgrade'
        ? 'bg-cyan-500/20 text-cyan-300'
        : type === 'Treasury'
          ? 'bg-amber-500/20 text-amber-300'
          : 'bg-slate-500/20 text-slate-400';
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {type}
    </span>
  );
}

function timeRemaining(endTime: number) {
  const diff = endTime - Date.now();
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
}

function VoteBar({ forPct, againstPct }: { forPct: number; againstPct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-700">
        <div className="flex h-full">
          <div className="bg-green-500" style={{ width: `${forPct}%` }} />
          <div className="bg-red-500" style={{ width: `${againstPct}%` }} />
        </div>
      </div>
      <span className="text-xs text-slate-400">{forPct}%</span>
    </div>
  );
}

export default async function GovernancePage() {
  const response = await fetchJsonSafe<ApiGovernanceProposals>(
    '/api/governance/proposals',
    { next: { revalidate: 15 } }
  );

  if (!response) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
        <SectionHeader title="DAO Governance" description="Governance data not available" />
      </main>
    );
  }

  const { proposals, stats } = response.data;
  const activeProposals = proposals.filter(p => p.status === 'Active').slice(0, 5);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <SectionHeader
        title="DAO Governance"
        description="On-chain governance for QFC protocol decisions, treasury, and parameter changes."
        action={
          <div className="flex gap-2">
            <Link
              href="/governance/proposals"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
            >
              View All Proposals
            </Link>
            <Link
              href="/governance/create"
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 transition-colors"
            >
              Create Proposal
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Active Proposals" value={stats.activeProposals.toString()} />
        <StatsCard label="Total Proposals" value={stats.totalProposals.toString()} />
        <StatsCard label="Participation Rate" value={stats.participationRate} />
        <StatsCard label="Quorum Threshold" value={stats.quorumThreshold} sub="minimum to pass" />
      </section>

      {/* Active Proposals */}
      {activeProposals.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="Active Proposals" />
          <div className="space-y-3">
            {activeProposals.map((p) => {
              const total = p.forVotes + p.againstVotes + p.abstainVotes;
              const forPct = total > 0 ? Math.round((p.forVotes / total) * 100) : 0;
              const againstPct = total > 0 ? Math.round((p.againstVotes / total) * 100) : 0;
              return (
                <Link
                  key={p.id}
                  href={`/governance/proposals/${p.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          #{p.id} {p.title}
                        </span>
                        {typeBadge(p.type)}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        by {shortenHash(p.proposer)} · {timeRemaining(p.endTime)}
                      </p>
                    </div>
                    {statusBadge(p.status)}
                  </div>
                  <div className="mt-3">
                    <VoteBar forPct={forPct} againstPct={againstPct} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Link to model governance */}
      <section className="space-y-4">
        <SectionHeader title="Other Governance" />
        <Link
          href="/governance/models"
          className="block rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700"
        >
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            AI Model Governance
          </span>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Validator voting for on-chain AI model registry approvals.
          </p>
        </Link>
      </section>
    </main>
  );
}
