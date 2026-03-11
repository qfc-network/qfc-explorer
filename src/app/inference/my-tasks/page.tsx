'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import { useTranslation } from '@/components/LocaleProvider';
import { apiUrl } from '@/lib/client-api';
import { shortenHash } from '@/lib/format';

type TaskItem = {
  taskId: string;
  status: string;
  submitter: string;
  taskType: string;
  modelId: string;
  createdAt: number;
  deadline: number;
  maxFee: string;
  result?: string;
  minerAddress?: string;
  executionTimeMs?: number;
};

type TaskStats = {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  avgExecutionTimeMs: number;
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  expired: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400',
};

export default function MyTasksPage() {
  const { t } = useTranslation();
  const [address, setAddress] = useState('');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 25;

  const fetchTasks = useCallback(async (addr: string, pg: number) => {
    if (!addr || !/^0x[0-9a-fA-F]{40}$/.test(addr)) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        submitter: addr.toLowerCase(),
        page: String(pg),
        limit: String(pageSize),
      });
      const res = await fetch(apiUrl(`/inference/tasks?${params}`));
      const json = await res.json();
      if (json.ok) {
        setTasks(json.data.items ?? []);
        setStats(json.data.stats ?? null);
        setTotal(json.data.total ?? 0);
        setSearched(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchTasks(address, 1);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    fetchTasks(address, newPage);
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader
          title={t('marketplace.myTasks')}
          description={t('marketplace.myTasksDescription')}
        />
        <Link
          href="/inference/submit"
          className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t('marketplace.submitTask')}
        </Link>
      </div>

      {/* Address Input */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x... (your wallet address)"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
        />
        <button
          type="submit"
          disabled={loading || !address}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 disabled:opacity-50"
        >
          {loading ? t('marketplace.loading') : t('marketplace.search')}
        </button>
      </form>

      {/* Stats */}
      {stats && searched && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label={t('marketplace.totalSubmitted')} value={total.toString()} />
          <StatsCard label={t('marketplace.completedTasks')} value={stats.completed.toString()} />
          <StatsCard label={t('marketplace.pendingTasks')} value={stats.pending.toString()} />
          <StatsCard
            label={t('marketplace.avgExecTime')}
            value={stats.avgExecutionTimeMs > 0 ? `${(stats.avgExecutionTimeMs / 1000).toFixed(1)}s` : '—'}
          />
        </section>
      )}

      {/* Tasks Table */}
      {searched && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80">
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('marketplace.taskId')}</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('marketplace.model')}</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('marketplace.status')}</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('marketplace.miner')}</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">{t('marketplace.fee')}</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">{t('marketplace.time')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {tasks.map((task) => (
                <tr key={task.taskId} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <Link href={`/task/${task.taskId}`} className="font-mono text-cyan-600 hover:underline dark:text-cyan-400">
                      {task.taskId.length > 12 ? `${task.taskId.slice(0, 8)}…` : task.taskId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{task.modelId}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[task.status.toLowerCase()] ?? STATUS_COLORS.expired
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                    {task.minerAddress ? (
                      <Link href={`/miner/${task.minerAddress}`} className="hover:underline">
                        {shortenHash(task.minerAddress)}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                    {task.maxFee}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                    {task.executionTimeMs ? `${(task.executionTimeMs / 1000).toFixed(1)}s` : '—'}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    {t('marketplace.noTasks')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}
