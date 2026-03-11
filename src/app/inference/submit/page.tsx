'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import SectionHeader from '@/components/SectionHeader';
import { AVAILABLE_MODELS, TASK_REGISTRY_ADDRESS, TASK_REGISTRY_ABI } from '@/lib/inference-contracts';
import { ethers } from 'ethers';

type SubmitState = 'idle' | 'connecting' | 'estimating' | 'submitting' | 'success' | 'error';

export default function InferenceSubmitPage() {
  const [modelId, setModelId] = useState<number>(AVAILABLE_MODELS[0].id);
  const [prompt, setPrompt] = useState('');
  const [maxFee, setMaxFee] = useState('0.01');
  const [estimatedCost, setEstimatedCost] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [resultTaskId, setResultTaskId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchEstimate = useCallback(async () => {
    try {
      setEstimatedCost(null);
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://rpc.testnet.qfc.network';
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const modelRegistry = new ethers.Contract(
        process.env.NEXT_PUBLIC_MODEL_REGISTRY_ADDRESS ?? '0x0000000000000000000000000000000000000000',
        ['function getBaseFee(uint256 modelId) view returns (uint256)'],
        provider,
      );
      const baseFee: bigint = await modelRegistry.getBaseFee(modelId);
      setEstimatedCost(ethers.formatEther(baseFee));
    } catch {
      setEstimatedCost('~0.01');
    }
  }, [modelId]);

  useEffect(() => {
    fetchEstimate();
  }, [fetchEstimate]);

  async function connectWallet() {
    if (typeof window === 'undefined' || !window.ethereum) {
      setErrorMsg('No wallet detected. Please install MetaMask or a compatible wallet.');
      setSubmitState('error');
      return;
    }

    setSubmitState('connecting');
    setErrorMsg('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
      setSubmitState('idle');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to connect wallet');
      setSubmitState('error');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!account || !prompt.trim()) return;

    setSubmitState('submitting');
    setErrorMsg('');
    setResultTaskId(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const taskRegistry = new ethers.Contract(
        TASK_REGISTRY_ADDRESS,
        TASK_REGISTRY_ABI,
        signer,
      );

      const inputBytes = ethers.toUtf8Bytes(prompt.trim());
      const feeWei = ethers.parseEther(maxFee || '0.01');

      const tx = await taskRegistry.submitTask(modelId, inputBytes, { value: feeWei });
      const receipt = await tx.wait();

      // Parse TaskSubmitted event from receipt
      const iface = new ethers.Interface(TASK_REGISTRY_ABI);
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
          if (parsed?.name === 'TaskSubmitted') {
            setResultTaskId(parsed.args.taskId.toString());
            break;
          }
        } catch {
          // Not our event
        }
      }

      if (!resultTaskId) {
        // Fallback: just show tx hash
        setResultTaskId(receipt.hash);
      }

      setSubmitState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
      setSubmitState('error');
    }
  }

  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === modelId);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader
          title="Submit Inference Task"
          description="Submit an AI inference task to the QFC network."
        />
        <Link
          href="/inference"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          Back to Inference
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Model Selector */}
        <div className="space-y-2">
          <label htmlFor="model" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Model
          </label>
          <select
            id="model"
            value={modelId}
            onChange={(e) => setModelId(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          {selectedModel && (
            <p className="text-xs text-slate-400">Model ID: {selectedModel.id}</p>
          )}
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Prompt / Input
          </label>
          <textarea
            id="prompt"
            rows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt or task description..."
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none resize-y"
          />
        </div>

        {/* Max Fee */}
        <div className="space-y-2">
          <label htmlFor="maxFee" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Max Fee (QFC)
          </label>
          <input
            id="maxFee"
            type="number"
            step="0.001"
            min="0"
            value={maxFee}
            onChange={(e) => setMaxFee(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 focus:border-cyan-500 focus:outline-none"
          />
          {estimatedCost && (
            <p className="text-xs text-slate-400">
              Estimated base cost: {estimatedCost} QFC
            </p>
          )}
        </div>

        {/* Submit / Connect */}
        {!account ? (
          <button
            type="button"
            onClick={connectWallet}
            disabled={submitState === 'connecting'}
            className="w-full rounded-lg bg-cyan-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:opacity-50"
          >
            {submitState === 'connecting' ? 'Connecting...' : 'Connect Wallet to Submit'}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Connected: <span className="font-mono text-slate-300">{account}</span>
            </p>
            <button
              type="submit"
              disabled={submitState === 'submitting' || !prompt.trim()}
              className="w-full rounded-lg bg-cyan-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:opacity-50"
            >
              {submitState === 'submitting' ? 'Submitting Task...' : 'Submit Task'}
            </button>
          </div>
        )}
      </form>

      {/* Error */}
      {submitState === 'error' && errorMsg && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Success */}
      {submitState === 'success' && resultTaskId && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-5 py-4 space-y-2">
          <p className="text-sm font-medium text-green-300">Task submitted successfully!</p>
          <p className="text-sm text-green-200">
            Task ID:{' '}
            <Link
              href={`/task/${resultTaskId}`}
              className="font-mono underline hover:text-green-100"
            >
              {resultTaskId}
            </Link>
          </p>
        </div>
      )}
    </main>
  );
}
