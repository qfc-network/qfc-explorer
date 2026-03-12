'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import type { GovernanceProposal } from '@/lib/api-types';
import { shortenHash } from '@/lib/format';

type Filter = 'All' | 'Active' | 'Passed' | 'Failed' | 'Pending';
const FILTERS: Filter[] = ['All', 'Active', 'Passed', 'Failed', 'Pending'];

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

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<GovernanceProposal[]>([]);
  const [filter, setFilter] = useState<Filter>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/governance/proposals')
      .then(r => r.json())
      .then(res => {
        if (res.ok) setProposals(res.data.proposals);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? proposals : proposals.filter(p => p.status === filter);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <SectionHeader
        title="All Proposals"
        description={`${proposals.length} total proposals`}
        action={
          <Link
            href="/governance/create"
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 transition-colors"
          >
            Create Proposal
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900/60">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">Loading proposals...</div>
      ) : (
        <Table
          rows={filtered as unknown as Record<string, unknown>[]}
          keyField="id"
          emptyMessage="No proposals found."
          columns={[
            {
              key: 'id',
              header: 'ID',
              render: (row) => (
                <Link
                  href={`/governance/proposals/${row.id}`}
                  className="text-cyan-500 hover:underline"
                >
                  #{String(row.id)}
                </Link>
              ),
            },
            {
              key: 'title',
              header: 'Title',
              render: (row) => (
                <Link
                  href={`/governance/proposals/${row.id}`}
                  className="text-slate-900 hover:text-cyan-500 dark:text-white dark:hover:text-cyan-400"
                >
                  {String(row.title)}
                </Link>
              ),
            },
            {
              key: 'type',
              header: 'Type',
              render: (row) => typeBadge(String(row.type)),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => statusBadge(String(row.status)),
            },
            {
              key: 'forVotes',
              header: 'For %',
              render: (row) => {
                const total = Number(row.forVotes) + Number(row.againstVotes) + Number(row.abstainVotes);
                const pct = total > 0 ? Math.round((Number(row.forVotes) / total) * 100) : 0;
                return <span className="text-green-400">{pct}%</span>;
              },
            },
            {
              key: 'againstVotes',
              header: 'Against %',
              render: (row) => {
                const total = Number(row.forVotes) + Number(row.againstVotes) + Number(row.abstainVotes);
                const pct = total > 0 ? Math.round((Number(row.againstVotes) / total) * 100) : 0;
                return <span className="text-red-400">{pct}%</span>;
              },
            },
            {
              key: 'endTime',
              header: 'End Date',
              render: (row) => {
                const d = new Date(Number(row.endTime));
                return <span className="text-slate-400">{d.toLocaleDateString()}</span>;
              },
            },
          ]}
        />
      )}
    </main>
  );
}
