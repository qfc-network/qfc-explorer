'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import { apiUrl } from '@/lib/client-api';
import { shortenHash, formatWeiToQfc } from '@/lib/format';
import type { InferenceTaskItem } from '@/lib/api-types';

const STATUS_FILTERS = ['All', 'Pending', 'Assigned', 'Completed', 'Failed'] as const;

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-500/20 text-yellow-300',
  Assigned: 'bg-blue-500/20 text-blue-300',
  Completed: 'bg-green-500/20 text-green-300',
  Failed: 'bg-red-500/20 text-red-300',
  Cancelled: 'bg-slate-500/20 text-slate-400',
  Challenged: 'bg-purple-500/20 text-purple-300',
};

export default function InferenceTasksPage() {
  const [tasks, setTasks] = useState<InferenceTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [walletFilter, setWalletFilter] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (walletFilter) params.set('submitter', walletFilter);

      const res = await fetch(apiUrl(`/api/inference/tasks?${params.toString()}`));
      const json = await res.json();
      if (json.ok) {
        setTasks(json.data.tasks);
        setError('');
      } else {
        setError(json.error || 'Failed to load tasks');
      }
    } catch {
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, walletFilter]);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 15_000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  async function connectAndFilter() {
    if (typeof window === 'undefined' || !window.ethereum) return;
    try {
      const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setWalletFilter(accounts[0]);
      }
    } catch {
      // User rejected
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader
          title="Inference Tasks"
          description="Browse recent AI inference tasks on the QFC network."
        />
        <div className="flex gap-2">
          <button
            onClick={connectAndFilter}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            {walletFilter ? 'My Tasks' : 'My Tasks'}
          </button>
          {walletFilter && (
            <button
              onClick={() => setWalletFilter('')}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Show All
            </button>
          )}
          <Link
            href="/inference"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Back to Inference
          </Link>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-cyan-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-6 text-sm text-slate-400">
          Loading tasks...
        </div>
      ) : (
        <Table
          rows={tasks}
          keyField="taskId"
          emptyMessage="No tasks found."
          columns={[
            {
              key: 'taskId',
              header: 'Task ID',
              render: (row) => (
                <Link href={`/task/${row.taskId}`} className="font-mono text-cyan-400 hover:underline">
                  #{row.taskId}
                </Link>
              ),
            },
            {
              key: 'modelName',
              header: 'Model',
              render: (row) => row.modelName,
            },
            {
              key: 'submitter',
              header: 'Submitter',
              render: (row) => (
                <Link href={`/address/${row.submitter}`} className="font-mono text-cyan-400 hover:underline">
                  {shortenHash(row.submitter)}
                </Link>
              ),
            },
            {
              key: 'miner',
              header: 'Miner',
              render: (row) =>
                row.miner ? (
                  <Link href={`/address/${row.miner}`} className="font-mono text-cyan-400 hover:underline">
                    {shortenHash(row.miner)}
                  </Link>
                ) : (
                  <span className="text-slate-500">—</span>
                ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[row.status] ?? 'bg-slate-500/20 text-slate-400'}`}>
                  {row.status}
                </span>
              ),
            },
            {
              key: 'maxFee',
              header: 'Fee',
              render: (row) => `${formatWeiToQfc(row.maxFee)} QFC`,
            },
            {
              key: 'createdAt',
              header: 'Time',
              render: (row) => {
                const ago = Date.now() - row.createdAt;
                if (ago < 60_000) return `${Math.floor(ago / 1000)}s ago`;
                if (ago < 3_600_000) return `${Math.floor(ago / 60_000)}m ago`;
                return new Date(row.createdAt).toLocaleString();
              },
            },
          ]}
        />
      )}

      <p className="text-xs text-slate-500">Auto-refreshes every 15 seconds</p>
    </main>
  );
}
