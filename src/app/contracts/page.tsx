export const dynamic = "force-dynamic";

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import { shortenHash, formatTimestampMs } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';

type ContractsResponse = {
  ok: boolean;
  data: {
    items: Array<{
      address: string;
      creator_tx_hash: string | null;
      created_at_block: string | null;
      is_verified: boolean;
    }>;
    total: number;
  };
};

export default async function ContractsPage() {
  const contractsResponse = await fetchJsonSafe<ContractsResponse>(
    '/api/contracts?limit=50',
    { next: { revalidate: 30 } }
  );

  const contracts = contractsResponse?.data?.items ?? [];
  const total = contractsResponse?.data?.total ?? 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="text-slate-500 hover:text-slate-300">Home</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300">Contracts</span>
        </div>
        <h1 className="text-3xl font-semibold text-white">Smart Contracts</h1>
        <p className="text-slate-400">
          {total > 0 ? `${total} contracts deployed` : 'No contracts deployed yet'}
        </p>
      </header>

      {/* Contract Interaction Tool */}
      <section className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-6">
        <h2 className="text-lg font-semibold text-blue-400 mb-2">Contract Interaction</h2>
        <p className="text-sm text-slate-300 mb-4">
          Enter a contract address to interact with it (read/write functions).
        </p>
        <ContractAddressInput />
      </section>

      {/* Token Links */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-3">Quick Links</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/tokens"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
          >
            ERC-20 Tokens
          </Link>
          <Link
            href="/token/qfc"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
          >
            QFC Tokenomics
          </Link>
          <Link
            href="/analytics"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Analytics
          </Link>
        </div>
      </section>

      {/* Contracts List */}
      {contracts.length > 0 ? (
        <section className="space-y-4">
          <SectionHeader
            title="Deployed Contracts"
            description="Recently deployed smart contracts"
          />
          <Table
            rows={contracts}
            emptyMessage="No contracts found"
            columns={[
              {
                key: 'address',
                header: 'Contract Address',
                render: (row) => (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/contract/${row.address}`}
                      className="font-mono text-slate-200 hover:text-white"
                    >
                      {shortenHash(row.address, 8)}
                    </Link>
                    {row.is_verified && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                ),
              },
              {
                key: 'creator_tx_hash',
                header: 'Creation Tx',
                render: (row) =>
                  row.creator_tx_hash ? (
                    <Link
                      href={`/txs/${row.creator_tx_hash}`}
                      className="font-mono text-slate-400 hover:text-slate-200"
                    >
                      {shortenHash(row.creator_tx_hash)}
                    </Link>
                  ) : (
                    <span className="text-slate-500">—</span>
                  ),
              },
              {
                key: 'created_at_block',
                header: 'Block',
                render: (row) =>
                  row.created_at_block ? (
                    <Link
                      href={`/blocks/${row.created_at_block}`}
                      className="text-slate-300 hover:text-white"
                    >
                      #{row.created_at_block}
                    </Link>
                  ) : (
                    <span className="text-slate-500">—</span>
                  ),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <Link
                    href={`/contract/${row.address}`}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Interact
                  </Link>
                ),
              },
            ]}
          />
        </section>
      ) : (
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
          <p className="text-slate-400">No contracts have been deployed yet.</p>
          <p className="text-sm text-slate-500 mt-2">
            Contracts will appear here once they are deployed to the network.
          </p>
        </section>
      )}
    </main>
  );
}

function ContractAddressInput() {
  return (
    <form action="/contract" method="GET" className="flex gap-2">
      <input
        type="text"
        name="address"
        placeholder="Enter contract address (0x...)"
        className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-mono text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        pattern="^0x[a-fA-F0-9]{40}$"
        required
      />
      <button
        type="submit"
        className="rounded-lg bg-blue-500 px-6 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
      >
        Go
      </button>
    </form>
  );
}
