export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Network',
  description: 'QFC network validators, epoch info, and hashrate.',
  openGraph: {
    title: 'Network | QFC Explorer',
    description: 'QFC network validators, epoch info, and hashrate.',
    type: 'website',
  },
};

import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import Table from '@/components/Table';
import TranslatedText from '@/components/TranslatedText';
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
        <SectionHeader title={<TranslatedText tKey="network.title" />} description={<TranslatedText tKey="network.dataNotAvailable" />} />
      </main>
    );
  }

  const { epoch, totalHashrate } = response.data;
  const nodeInfo = response.data.nodeInfo ?? { chainId: '9000', peerCount: 0, version: '—', isValidator: false, syncing: false };
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
      <SectionHeader title={<TranslatedText tKey="network.title" />} description={<TranslatedText tKey="network.description" />} />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatsCard label={<TranslatedText tKey="stats.chainId" />} value={nodeInfo.chainId} />
        <StatsCard label={<TranslatedText tKey="network.epoch" />} value={epoch.number} sub={`${epoch.durationMs} ms`} />
        <StatsCard label={<TranslatedText tKey="network.peers" />} value={formatNumber(nodeInfo.peerCount)} />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatsCard label={<TranslatedText tKey="network.version" />} value={nodeInfo.version} />
        <StatsCard label={<TranslatedText tKey="network.validator" />} value={nodeInfo.isValidator ? 'Yes' : 'No'} />
        <StatsCard label={<TranslatedText tKey="network.syncing" />} value={nodeInfo.syncing ? 'Yes' : 'No'} />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          label={<TranslatedText tKey="network.totalHashrate" />}
          value={formatHashrate(totalHashrate || '0')}
        />
        <StatsCard
          label={<TranslatedText tKey="network.miningValidators" />}
          value={miningValidators.toString()}
          sub={`${validators.length} total`}
        />
        <StatsCard
          label={<TranslatedText tKey="network.computeWeight" />}
          value="20%"
        />
      </section>

      <section className="space-y-4">
        <SectionHeader title={<TranslatedText tKey="network.validators" />} description={`${validators.length}`} />
        <Table
          rows={validators}
          keyField="address"
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
              key: 'computeMode',
              header: 'Mode',
              render: (row) => (
                <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                  row.computeMode === 'inference'
                    ? 'bg-blue-500/20 text-blue-300'
                    : row.computeMode === 'pow'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {row.computeMode ?? 'pow'}
                </span>
              ),
            },
            {
              key: 'inferenceScore',
              header: 'Inference',
              render: (row) => row.inferenceScore !== '0' ? row.inferenceScore : '—',
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
