import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import Table from '@/components/Table';
import { RpcClient } from '@/indexer/rpc';
import { fetchEpoch, fetchNodeInfo, fetchValidators } from '@/indexer/qfc';
import { formatNumber, shortenHash } from '@/lib/format';

const rpcUrl = process.env.RPC_URL;

export default async function NetworkPage() {
  if (!rpcUrl) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
        <SectionHeader title="Network" description="RPC_URL is not configured" />
      </main>
    );
  }

  const client = new RpcClient(rpcUrl);
  const [epoch, nodeInfo, validators] = await Promise.all([
    fetchEpoch(client),
    fetchNodeInfo(client),
    fetchValidators(client),
  ]);

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
              render: (row) => row.stake,
            },
            {
              key: 'score',
              header: 'Contribution',
              render: (row) => row.contributionScore,
            },
            {
              key: 'uptime',
              header: 'Uptime',
              render: (row) => row.uptime,
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
