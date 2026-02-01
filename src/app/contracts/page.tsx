import Link from 'next/link';
import SectionHeader from '@/components/SectionHeader';

export default function ContractsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
      <SectionHeader title="Contracts" description="Token/contract indexing not enabled yet." />
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-300">
        <p>Contract discovery will appear here once token metadata is indexed.</p>
        <p className="mt-3 text-sm text-slate-400">
          Meanwhile, see <Link href="/token/qfc" className="text-slate-200">QFC tokenomics</Link>.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Indexed ERC-20 tokens: <Link href="/tokens" className="text-slate-200">Tokens list</Link>.
        </p>
      </div>
    </main>
  );
}
