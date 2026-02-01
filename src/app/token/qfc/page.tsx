export const dynamic = "force-dynamic";

import SectionHeader from '@/components/SectionHeader';
import { TOKENOMICS } from '@/lib/tokenomics';

export default function QfcTokenPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <SectionHeader
        title={`${TOKENOMICS.name} (${TOKENOMICS.symbol})`}
        description="Native token economics"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Decimals</p>
          <p className="mt-2 text-lg text-white">{TOKENOMICS.decimals}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Initial Supply</p>
          <p className="mt-2 text-lg text-white">{TOKENOMICS.initialSupply} QFC</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Max Supply</p>
          <p className="mt-2 text-lg text-white">{TOKENOMICS.maxSupply} QFC</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Block Reward</p>
          <p className="mt-2 text-lg text-white">{TOKENOMICS.blockReward} QFC</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Min Block Reward</p>
          <p className="mt-2 text-lg text-white">{TOKENOMICS.minBlockReward} QFC</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Halving Period</p>
          <p className="mt-2 text-lg text-white">{TOKENOMICS.halvingPeriodYears} year</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fee Distribution</p>
        <p className="mt-3 text-sm text-slate-300">
          Producer {TOKENOMICS.producerRewardPercent}% · Voters {TOKENOMICS.votersRewardPercent}% · Burn {TOKENOMICS.feeBurnPercent}%
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Min Validator Stake</p>
          <p className="mt-2 text-lg text-white">{TOKENOMICS.minValidatorStake} QFC</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Min Delegation</p>
          <p className="mt-2 text-lg text-white">{TOKENOMICS.minDelegation} QFC</p>
        </div>
      </div>
    </main>
  );
}
