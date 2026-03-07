export const dynamic = "force-dynamic";

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import { shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import ContractInteraction from '@/components/ContractInteraction';
import ContractVerification from '@/components/ContractVerification';

type ContractInfo = {
  ok: boolean;
  data: {
    address: string;
    code: string;
    balance: string;
    nonce: string;
    is_contract: boolean;
    creator_tx?: string;
    created_at_block?: string;
    is_verified?: boolean;
    source_code?: string;
    abi?: unknown[];
    compiler_version?: string;
    evm_version?: string;
    optimization_runs?: number;
    verified_at?: string;
    similar_contracts?: Array<{ address: string; is_verified: boolean }>;
    proxy_type?: string;
    implementation_address?: string;
  };
};

type Props = {
  params: Promise<{ address: string }>;
};

export default async function ContractPage(props: Props) {
  const { address } = await props.params;

  const contractInfo = await fetchJsonSafe<ContractInfo>(
    `/api/contract/${address}`,
    { next: { revalidate: 30 } }
  );

  const isContract = contractInfo?.data?.is_contract ?? false;
  const code = contractInfo?.data?.code ?? '0x';
  const isVerified = contractInfo?.data?.is_verified ?? false;
  const proxyType = contractInfo?.data?.proxy_type;
  const implAddress = contractInfo?.data?.implementation_address;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="text-slate-500 hover:text-slate-300">Home</Link>
          <span className="text-slate-600">/</span>
          <Link href="/contracts" className="text-slate-500 hover:text-slate-300">Contracts</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300">{shortenHash(address)}</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold text-white">
            {isContract ? 'Contract' : 'Address'}
          </h1>
          {isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400 border border-green-500/30">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          )}
          {proxyType && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/30">
              Proxy ({proxyType})
            </span>
          )}
        </div>
      </header>

      {/* Contract Overview */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Address</p>
            <p className="font-mono text-slate-200 break-all">{address}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Type</p>
            <p className="text-slate-200">
              {isContract ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Contract
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  EOA (Externally Owned Account)
                </span>
              )}
            </p>
          </div>
          {contractInfo?.data?.balance && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Balance</p>
              <p className="text-slate-200">{contractInfo.data.balance} QFC</p>
            </div>
          )}
          {contractInfo?.data?.creator_tx && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Creator Transaction</p>
              <Link
                href={`/txs/${contractInfo.data.creator_tx}`}
                className="font-mono text-slate-200 hover:text-white"
              >
                {shortenHash(contractInfo.data.creator_tx)}
              </Link>
            </div>
          )}
          {proxyType && implAddress && (
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Implementation Contract</p>
              <div className="flex items-center gap-2 mt-1">
                <Link
                  href={`/contract/${implAddress}`}
                  className="font-mono text-cyan-400 hover:text-cyan-300 break-all"
                >
                  {implAddress}
                </Link>
                <span className="shrink-0 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                  {proxyType}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Contract Verification & Source Code */}
      {isContract && (
        <ContractVerification
          address={address}
          isVerified={isVerified}
          sourceCode={contractInfo?.data?.source_code}
          compilerVersion={contractInfo?.data?.compiler_version}
          evmVersion={contractInfo?.data?.evm_version}
          optimizationRuns={contractInfo?.data?.optimization_runs}
          verifiedAt={contractInfo?.data?.verified_at}
        />
      )}

      {/* Contract Interaction */}
      {isContract && (
        <ContractInteraction address={address} />
      )}

      {/* Similar Contracts */}
      {isContract && contractInfo?.data?.similar_contracts && contractInfo.data.similar_contracts.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            title="Similar Contracts"
            description="Contracts with the same bytecode hash"
          />
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex flex-wrap gap-2">
              {contractInfo.data.similar_contracts.map((c) => (
                <Link
                  key={c.address}
                  href={`/contract/${c.address}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-mono hover:border-cyan-500/40 hover:bg-slate-800 transition-colors"
                >
                  <span className="text-cyan-400">{shortenHash(c.address, 8, 6)}</span>
                  {c.is_verified && (
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">Verified</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contract Bytecode */}
      {isContract && code !== '0x' && (
        <section className="space-y-4">
          <SectionHeader
            title="Contract Bytecode"
            description="Deployed contract code"
          />
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <pre className="text-xs text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-64">
              {code}
            </pre>
          </div>
        </section>
      )}

      {/* Link to address page */}
      <div className="text-center">
        <Link
          href={`/address/${address}`}
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          View full address details and transaction history
        </Link>
      </div>
    </main>
  );
}
