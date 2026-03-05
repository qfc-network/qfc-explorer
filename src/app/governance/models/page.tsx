export const dynamic = "force-dynamic";

import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import Table from '@/components/Table';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiGovernanceModels } from '@/lib/api-types';
import { shortenHash } from '@/lib/format';

export default async function GovernanceModelsPage() {
  const response = await fetchJsonSafe<ApiGovernanceModels>(
    '/api/governance/models',
    { next: { revalidate: 15 } }
  );

  if (!response) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
        <SectionHeader title="Model Governance" description="Governance data not available" />
      </main>
    );
  }

  const { proposals, models } = response.data;
  const activeProposals = proposals.filter(p => p.status === 'Active');
  const passedProposals = proposals.filter(p => p.status === 'Passed');

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <SectionHeader
        title="Model Governance"
        description="On-chain governance for AI model registry. Validators vote to approve new models."
      />

      {/* Overview Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Proposals" value={proposals.length.toString()} />
        <StatsCard label="Active" value={activeProposals.length.toString()} />
        <StatsCard label="Passed" value={passedProposals.length.toString()} />
        <StatsCard
          label="Approval Threshold"
          value=">2/3"
          sub="of active validators"
        />
      </section>

      {/* Approved Models */}
      <section className="space-y-4">
        <SectionHeader
          title="Approved Models"
          description={`${models.length} models in registry`}
        />
        <Table
          rows={models}
          emptyMessage="No approved models yet."
          columns={[
            {
              key: 'name',
              header: 'Model Name',
              render: (row) => row.name,
            },
            {
              key: 'version',
              header: 'Version',
              render: (row) => row.version,
            },
            {
              key: 'minTier',
              header: 'Min Tier',
              render: (row) => (
                <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                  row.minTier === 'Hot'
                    ? 'bg-red-500/20 text-red-300'
                    : row.minTier === 'Warm'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-cyan-500/20 text-cyan-300'
                }`}>
                  {row.minTier}
                </span>
              ),
            },
            {
              key: 'minMemoryMb',
              header: 'Min Memory',
              render: (row) => `${row.minMemoryMb} MB`,
            },
          ]}
        />
      </section>

      {/* Proposals Table */}
      {proposals.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            title="Proposals"
            description={`${proposals.length} total proposals`}
          />
          <Table
            rows={proposals}
            emptyMessage="No proposals submitted yet."
            columns={[
              {
                key: 'proposalId',
                header: 'ID',
                render: (row) => shortenHash(row.proposalId),
              },
              {
                key: 'modelName',
                header: 'Model',
                render: (row) => `${row.modelName} ${row.modelVersion}`,
              },
              {
                key: 'proposer',
                header: 'Proposer',
                render: (row) => shortenHash(row.proposer),
              },
              {
                key: 'votesFor',
                header: 'For/Against',
                render: (row) => `${row.votesFor} / ${row.votesAgainst}`,
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                    row.status === 'Active'
                      ? 'bg-blue-500/20 text-blue-300'
                      : row.status === 'Passed'
                        ? 'bg-green-500/20 text-green-300'
                        : row.status === 'Rejected'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {row.status}
                  </span>
                ),
              },
            ]}
          />
        </section>
      )}
    </main>
  );
}
