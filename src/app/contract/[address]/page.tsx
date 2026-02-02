export const dynamic = "force-dynamic";

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import { shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import ContractInteraction from '@/components/ContractInteraction';

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
        <h1 className="text-3xl font-semibold text-white">
          {isContract ? 'Contract' : 'Address'}
        </h1>
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
        </div>
      </section>

      {/* Contract Interaction */}
      {isContract && (
        <ContractInteraction address={address} />
      )}

      {/* Contract Code */}
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
