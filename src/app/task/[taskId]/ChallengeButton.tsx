'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { TASK_REGISTRY_ADDRESS, TASK_REGISTRY_ABI } from '@/lib/inference-contracts';

export default function ChallengeButton({ taskId }: { taskId: string }) {
  const [challenging, setChallenging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleChallenge() {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('No wallet detected. Please install MetaMask or a compatible wallet.');
      return;
    }

    setChallenging(true);
    setError('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const taskRegistry = new ethers.Contract(
        TASK_REGISTRY_ADDRESS,
        TASK_REGISTRY_ABI,
        signer,
      );
      const tx = await taskRegistry.challengeResult(taskId);
      await tx.wait();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Challenge failed');
    } finally {
      setChallenging(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
        Challenge submitted successfully. The result is now under review.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleChallenge}
        disabled={challenging}
        className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
      >
        {challenging ? 'Challenging...' : 'Challenge Result'}
      </button>
      {error && (
        <p className="text-sm text-red-300">{error}</p>
      )}
    </div>
  );
}
