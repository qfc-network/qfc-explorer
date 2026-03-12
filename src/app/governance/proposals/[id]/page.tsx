'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import Table from '@/components/Table';
import type { GovernanceProposal, GovernanceVoter } from '@/lib/api-types';
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

function voteBadge(vote: string) {
  const cls =
    vote === 'For'
      ? 'bg-green-500/20 text-green-300'
      : vote === 'Against'
        ? 'bg-red-500/20 text-red-300'
        : 'bg-slate-500/20 text-slate-400';
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {vote}
    </span>
  );
}

function formatNumber(n: number) {
  return new Intl.NumberFormat().format(n);
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString();
}

function timeRemaining(endTime: number) {
  const diff = endTime - Date.now();
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
}

export default function ProposalDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [proposal, setProposal] = useState<GovernanceProposal | null>(null);
  const [voters, setVoters] = useState<GovernanceVoter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/governance/proposals/${id}`)
      .then(r => r.json())
      .then(res => {
        if (res.ok) {
          setProposal(res.data.proposal);
          setVoters(res.data.voters);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-12">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading proposal...</p>
      </main>
    );
  }

  if (error || !proposal) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
        <SectionHeader title="Proposal Not Found" description="The requested proposal does not exist." />
        <Link href="/governance/proposals" className="text-sm text-cyan-500 hover:underline">
          Back to proposals
        </Link>
      </main>
    );
  }

  const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
  const forPct = totalVotes > 0 ? Math.round((proposal.forVotes / totalVotes) * 100) : 0;
  const againstPct = totalVotes > 0 ? Math.round((proposal.againstVotes / totalVotes) * 100) : 0;
  const abstainPct = totalVotes > 0 ? Math.round((proposal.abstainVotes / totalVotes) * 100) : 0;
  const quorumPct = proposal.quorumRequired > 0
    ? Math.min(100, Math.round((proposal.quorum / proposal.quorumRequired) * 100))
    : 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      {/* Header */}
      <div>
        <Link href="/governance/proposals" className="text-sm text-cyan-500 hover:underline">
          ← All Proposals
        </Link>
        <div className="mt-3 flex flex-wrap items-start gap-3">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            #{proposal.id} {proposal.title}
          </h1>
          {statusBadge(proposal.status)}
          {typeBadge(proposal.type)}
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Proposed by{' '}
          <Link href={`/address/${proposal.proposer}`} className="text-cyan-500 hover:underline">
            {shortenHash(proposal.proposer)}
          </Link>
          {' · '}{timeRemaining(proposal.endTime)}
        </p>
      </div>

      {/* Description */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white">Description</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {proposal.description}
        </p>
        {proposal.paramKey && (
          <div className="mt-4 rounded-lg bg-slate-100 p-3 dark:bg-slate-800/60">
            <p className="text-xs text-slate-500 dark:text-slate-400">Parameter Change</p>
            <p className="mt-1 text-sm text-slate-900 dark:text-white">
              <span className="font-mono">{proposal.paramKey}</span>:{' '}
              <span className="text-red-400 line-through">{proposal.paramCurrentValue}</span>{' '}
              → <span className="text-green-400">{proposal.paramProposedValue}</span>
            </p>
          </div>
        )}
      </div>

      {/* Vote Breakdown */}
      <section className="space-y-4">
        <SectionHeader title="Vote Breakdown" />
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard label="For" value={`${forPct}%`} sub={`${formatNumber(proposal.forVotes)} QFC`} highlight />
          <StatsCard label="Against" value={`${againstPct}%`} sub={`${formatNumber(proposal.againstVotes)} QFC`} />
          <StatsCard label="Abstain" value={`${abstainPct}%`} sub={`${formatNumber(proposal.abstainVotes)} QFC`} />
        </div>

        {/* Progress bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>For {forPct}%</span>
            <span>Against {againstPct}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-700">
            <div className="flex h-full">
              <div className="bg-green-500 transition-all" style={{ width: `${forPct}%` }} />
              <div className="bg-red-500 transition-all" style={{ width: `${againstPct}%` }} />
              <div className="bg-slate-500 transition-all" style={{ width: `${abstainPct}%` }} />
            </div>
          </div>
        </div>

        {/* Quorum */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-900 dark:text-white">Quorum Progress</span>
            <span className="text-sm font-medium text-slate-900 dark:text-white">{quorumPct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
            <div
              className={`h-full transition-all ${quorumPct >= 100 ? 'bg-green-500' : 'bg-cyan-500'}`}
              style={{ width: `${quorumPct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {formatNumber(proposal.quorum)} / {formatNumber(proposal.quorumRequired)} QFC required
          </p>
        </div>
      </section>

      {/* Vote Buttons */}
      {proposal.status === 'Active' && (
        <section className="space-y-4">
          <SectionHeader title="Cast Your Vote" description="Connect your wallet to vote on this proposal." />
          <div className="flex gap-3">
            <button className="flex-1 rounded-lg bg-green-600 py-3 text-sm font-medium text-white hover:bg-green-500 transition-colors">
              Vote For
            </button>
            <button className="flex-1 rounded-lg bg-red-600 py-3 text-sm font-medium text-white hover:bg-red-500 transition-colors">
              Vote Against
            </button>
            <button className="flex-1 rounded-lg border border-slate-600 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors">
              Abstain
            </button>
          </div>
        </section>
      )}

      {/* Voters Table */}
      {voters.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="Voters" description={`${voters.length} votes cast`} />
          <Table
            rows={voters as unknown as Record<string, unknown>[]}
            keyField="address"
            emptyMessage="No votes yet."
            columns={[
              {
                key: 'address',
                header: 'Address',
                render: (row) => (
                  <Link
                    href={`/address/${row.address}`}
                    className="font-mono text-cyan-500 hover:underline"
                  >
                    {shortenHash(String(row.address))}
                  </Link>
                ),
              },
              {
                key: 'vote',
                header: 'Vote',
                render: (row) => voteBadge(String(row.vote)),
              },
              {
                key: 'votingPower',
                header: 'Voting Power',
                render: (row) => `${formatNumber(Number(row.votingPower))} QFC`,
              },
              {
                key: 'timestamp',
                header: 'Time',
                render: (row) => (
                  <span className="text-slate-400">{formatDate(Number(row.timestamp))}</span>
                ),
              },
            ]}
          />
        </section>
      )}

      {/* Timeline */}
      <section className="space-y-4">
        <SectionHeader title="Timeline" />
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="space-y-4">
            {[
              { label: 'Created', time: proposal.createdAt, done: true },
              { label: 'Voting Start', time: proposal.startTime, done: Date.now() >= proposal.startTime },
              { label: 'Voting End', time: proposal.endTime, done: Date.now() >= proposal.endTime },
              { label: 'Execution', time: proposal.executedAt, done: !!proposal.executedAt },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${step.done ? 'bg-green-500' : 'bg-slate-600'}`} />
                <span className="text-sm text-slate-900 dark:text-white">{step.label}</span>
                <span className="text-xs text-slate-400">
                  {step.time ? formatDate(Number(step.time)) : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
