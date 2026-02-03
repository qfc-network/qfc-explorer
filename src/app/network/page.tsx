export const dynamic = "force-dynamic";

import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import Table from '@/components/Table';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiNetwork } from '@/lib/api-types';
import { formatNumber, shortenHash } from '@/lib/format';
import { formatHashrate, formatPercentage, formatQfcAmount } from '@/lib/qfc-format';

export default async function NetworkPage() {
  const response = await fetchJsonSafe<ApiNetwork>(
    '/api/network',
    { next: { revalidate: 15 } }
  );

  if (!response) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
        <SectionHeader title="Network" description="Network data not available" />
      </main>
    );
  }

  const { epoch, nodeInfo, totalHashrate } = response.data;
  const validatorsRaw = response.data.validators ?? [];
  const miningValidators = validatorsRaw.filter(v => v.providesCompute).length;
  const validators = validatorsRaw.sort((a, b) => {
    const aScore = Number(a.contributionScore);
    const bScore = Number(b.contributionScore);
    if (Number.isFinite(aScore) && Number.isFinite(bScore)) {
      return bScore - aScore;
    }
    return b.address.localeCompare(a.address);
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <SectionHeader title="Network" description="QFC validator and epoch status." />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="Chain ID" value={nodeInfo.chainId} />
        <StatsCard label="Epoch" value={epoch.number} sub={`Duration ${epoch.durationMs} ms`} />
        <StatsCard label="Peers" value={formatNumber(nodeInfo.peerCount)} />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="Version" value={nodeInfo.version} />
        <StatsCard label="Validator" value={nodeInfo.isValidator ? 'Yes' : 'No'} />
        <StatsCard label="Syncing" value={nodeInfo.syncing ? 'Yes' : 'No'} />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total Hashrate"
          value={formatHashrate(totalHashrate || '0')}
          sub="Network compute power"
        />
        <StatsCard
          label="Mining Validators"
          value={miningValidators.toString()}
          sub={`of ${validators.length} total`}
        />
        <StatsCard
          label="Compute Weight"
          value="20%"
          sub="PoC contribution"
        />
      </section>

      <section className="space-y-4">
        <SectionHeader title="Validators" description={`${validators.length} active validators`} />
        <Table
          rows={validators}
          emptyMessage="No validators reported yet."
          columns={[
            {
              key: 'address',
              header: 'Address',
              render: (row) => shortenHash(row.address),
            },
            {
              key: 'stake',
              header: 'Stake',
              render: (row) => `${formatQfcAmount(row.stake)} QFC`,
            },
            {
              key: 'score',
              header: 'Contribution',
              render: (row) => row.contributionScore,
            },
            {
              key: 'hashrate',
              header: 'Hashrate',
              render: (row) => row.providesCompute ? formatHashrate(row.hashrate) : '—',
            },
            {
              key: 'uptime',
              header: 'Uptime',
              render: (row) => formatPercentage(row.uptime),
            },
            {
              key: 'active',
              header: 'Active',
              render: (row) => (row.isActive ? 'Yes' : 'No'),
            },
          ]}
        />
      </section>
    </main>
  );
}
