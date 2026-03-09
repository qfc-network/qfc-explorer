export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verified Contracts',
  description: 'Verified smart contracts on the QFC blockchain.',
  openGraph: {
    title: 'Verified Contracts | QFC Explorer',
    description: 'Verified smart contracts on the QFC blockchain.',
    type: 'website',
  },
};

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import { shortenHash, formatNumber } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import ContractsCsvExport from '@/components/ContractsCsvExport';
import ContractsFilter from '@/components/ContractsFilter';

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

type VerifiedResponse = {
  ok: boolean;
  data: {
    items: Array<{
      address: string;
      compiler_version: string | null;
      verified_at: string | null;
      token_name: string | null;
      token_symbol: string | null;
      interaction_count: number;
    }>;
    total: number;
    page: number;
    limit: number;
  };
};

type CompilersResponse = {
  ok: boolean;
  data: string[];
};

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function ContractsPage({ searchParams }: Props) {
  // Build query string from search params for the verified endpoint
  const verifiedParams = new URLSearchParams();
  const paramKeys = ['search', 'compiler', 'sort', 'order', 'has_abi', 'page', 'limit'];
  for (const key of paramKeys) {
    const value = searchParams[key];
    if (typeof value === 'string' && value) {
      verifiedParams.set(key, value);
    }
  }
  const verifiedQs = verifiedParams.toString();
  const verifiedPath = verifiedQs
    ? `/api/contracts/verified?${verifiedQs}`
    : '/api/contracts/verified';

  const [contractsResponse, verifiedResponse, compilersResponse] = await Promise.all([
    fetchJsonSafe<ContractsResponse>(
      '/api/contracts?limit=50',
      { next: { revalidate: 30 } }
    ),
    fetchJsonSafe<VerifiedResponse>(
      verifiedPath,
      { next: { revalidate: 30 } }
    ),
    fetchJsonSafe<CompilersResponse>(
      '/api/contracts/compilers',
      { next: { revalidate: 300 } }
    ),
  ]);

  const contracts = contractsResponse?.data?.items ?? [];
  const total = contractsResponse?.data?.total ?? 0;
  const verifiedContracts = verifiedResponse?.data?.items ?? [];
  const verifiedTotal = verifiedResponse?.data?.total ?? 0;
  const verifiedPage = verifiedResponse?.data?.page ?? 1;
  const verifiedLimit = verifiedResponse?.data?.limit ?? 25;
  const compilers = compilersResponse?.data ?? [];

  const hasPrevPage = verifiedPage > 1;
  const hasNextPage = verifiedContracts.length === verifiedLimit;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="text-slate-500 hover:text-slate-300">Home</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-600 dark:text-slate-300">Contracts</span>
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Smart Contracts</h1>
        <p className="text-slate-400">
          {total > 0 ? `${total} contracts deployed` : 'No contracts deployed yet'}
        </p>
      </header>

      {/* Contract Interaction Tool */}
      <section className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-6">
        <h2 className="text-lg font-semibold text-blue-400 mb-2">Contract Interaction</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Enter a contract address to interact with it (read/write functions).
        </p>
        <ContractAddressInput />
      </section>

      {/* Token Links */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Quick Links</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/tokens"
            className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ERC-20 Tokens
          </Link>
          <Link
            href="/token/qfc"
            className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            QFC Tokenomics
          </Link>
          <Link
            href="/analytics"
            className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Analytics
          </Link>
        </div>
      </section>

      {/* Verified Contracts with Filter */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader
            title={`Verified Contracts (${verifiedTotal})`}
            description="Verified contracts ranked by interaction count"
          />
          {verifiedContracts.length > 0 && (
            <ContractsCsvExport contracts={verifiedContracts} />
          )}
        </div>

        <ContractsFilter compilers={compilers} total={verifiedTotal} />

        {verifiedContracts.length > 0 ? (
          <>
            <Table
              rows={verifiedContracts}
              keyField="address"
              emptyMessage="No verified contracts"
              columns={[
                {
                  key: 'rank',
                  header: '#',
                  render: (_, i) => (
                    <span className="text-slate-500">{(verifiedPage - 1) * verifiedLimit + (i ?? 0) + 1}</span>
                  ),
                },
                {
                  key: 'address',
                  header: 'Contract',
                  render: (row) => (
                    <div>
                      <Link
                        href={`/contract/${row.address}`}
                        className="font-mono text-cyan-400 hover:text-cyan-300"
                      >
                        {shortenHash(row.address, 8)}
                      </Link>
                      {(row.token_name || row.token_symbol) && (
                        <span className="ml-2 text-xs text-slate-400">
                          {row.token_name || row.token_symbol}
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'compiler',
                  header: 'Compiler',
                  render: (row) => (
                    <span className="text-xs text-slate-400">{row.compiler_version || '\u2014'}</span>
                  ),
                },
                {
                  key: 'interactions',
                  header: 'Interactions',
                  render: (row) => (
                    <span className="text-slate-600 dark:text-slate-300">{formatNumber(row.interaction_count)}</span>
                  ),
                },
              ]}
            />

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Page {verifiedPage}
              </span>
              <div className="flex gap-2">
                {hasPrevPage && (
                  <PaginationLink searchParams={searchParams} page={verifiedPage - 1} label="Previous" />
                )}
                {hasNextPage && (
                  <PaginationLink searchParams={searchParams} page={verifiedPage + 1} label="Next" />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-8 text-center">
            <p className="text-slate-400">No verified contracts match the current filters.</p>
          </div>
        )}
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
            keyField="address"
            emptyMessage="No contracts found"
            columns={[
              {
                key: 'address',
                header: 'Contract Address',
                render: (row) => (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/contract/${row.address}`}
                      className="font-mono text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white"
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
                    <span className="text-slate-500">{'\u2014'}</span>
                  ),
              },
              {
                key: 'created_at_block',
                header: 'Block',
                render: (row) =>
                  row.created_at_block ? (
                    <Link
                      href={`/blocks/${row.created_at_block}`}
                      className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                      #{row.created_at_block}
                    </Link>
                  ) : (
                    <span className="text-slate-500">{'\u2014'}</span>
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
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-8 text-center">
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
        className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        pattern="^0x[a-fA-F0-9]{40}$"
        required
      />
      <button
        type="submit"
        className="rounded-lg bg-blue-500 px-6 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-blue-600 transition-colors"
      >
        Go
      </button>
    </form>
  );
}

function PaginationLink({
  searchParams,
  page,
  label,
}: {
  searchParams: Record<string, string | string[] | undefined>;
  page: number;
  label: string;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string' && value && key !== 'page') {
      params.set(key, value);
    }
  }
  params.set('page', String(page));

  return (
    <Link
      href={`/contracts?${params.toString()}`}
      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      {label}
    </Link>
  );
}
