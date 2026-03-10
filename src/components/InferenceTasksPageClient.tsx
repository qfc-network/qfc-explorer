'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { shortenHash } from '@/lib/format';
import { formatQfcAmount, formatDuration } from '@/lib/qfc-format';
import TranslatedPagination from '@/components/TranslatedPagination';
import StatsCard from '@/components/StatsCard';
import CsvExport from '@/components/CsvExport';

type Task = {
  taskId: string;
  status: string;
  submitter: string;
  taskType: string;
  modelId: string;
  createdAt: number;
  deadline: number;
  maxFee: string;
  minerAddress?: string;
  executionTimeMs?: number;
};

type Stats = {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  avgExecutionTimeMs: number;
};

type Props = {
  tasks: Task[];
  stats: Stats | null;
  total: number;
  page: number;
  pageSize: number;
  statusFilter: string | null;
};

const STATUS_OPTIONS = ['Pending', 'Assigned', 'Completed', 'Failed', 'Expired'] as const;

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-500/10 text-amber-400',
  Assigned: 'bg-blue-500/10 text-blue-400',
  Completed: 'bg-green-500/10 text-green-400',
  Failed: 'bg-red-500/10 text-red-400',
  Expired: 'bg-slate-500/10 text-slate-400',
};

function formatTime(timestamp: number): string {
  if (!timestamp) return '—';
  return new Date(timestamp * 1000).toLocaleString();
}

export default function InferenceTasksPageClient({
  tasks,
  stats,
  total,
  page,
  pageSize,
  statusFilter,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleStatusChange(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    params.delete('page');
    router.push(`/inference/tasks?${params}`);
  }

  function buildHref(p: number) {
    const params = new URLSearchParams();
    params.set('page', String(p));
    if (statusFilter) params.set('status', statusFilter);
    return `/inference/tasks?${params}`;
  }

  const totalPages = Math.ceil(total / pageSize);
  const hasNext = page < totalPages;
  const hasPrevious = page > 1;

  const csvData = useMemo(() =>
    tasks.map((t) => ({
      taskId: t.taskId,
      status: t.status,
      model: t.modelId,
      submitter: t.submitter,
      fee: formatQfcAmount(t.maxFee),
      createdAt: formatTime(t.createdAt),
      miner: t.minerAddress ?? '',
      executionTime: t.executionTimeMs ? `${t.executionTimeMs}ms` : '',
    })),
    [tasks]
  );

  const csvColumns = useMemo(() => [
    { key: 'taskId', label: 'Task ID' },
    { key: 'status', label: 'Status' },
    { key: 'model', label: 'Model' },
    { key: 'submitter', label: 'Submitter' },
    { key: 'fee', label: 'Fee (QFC)' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'miner', label: 'Miner' },
    { key: 'executionTime', label: 'Execution Time' },
  ], []);

  const completionRate = stats && stats.total > 0
    ? ((stats.completed / stats.total) * 100).toFixed(1)
    : '0';

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Inference Tasks</h1>
          <p className="mt-1 text-sm text-slate-400">Recent AI inference tasks on the QFC network</p>
        </div>
        <CsvExport data={csvData} filename="qfc_inference_tasks" columns={csvColumns} />
      </div>

      {/* Stats Summary */}
      {stats && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Total Tasks" value={stats.total.toLocaleString()} />
          <StatsCard
            label="Completion Rate"
            value={`${completionRate}%`}
            sub={`${stats.completed.toLocaleString()} completed`}
          />
          <StatsCard
            label="Avg Execution Time"
            value={formatDuration(String(stats.avgExecutionTimeMs))}
          />
          <StatsCard
            label="Pending / Failed"
            value={`${stats.pending} / ${stats.failed}`}
          />
        </section>
      )}

      {/* Status Filter */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-slate-500">Status:</span>
        <button
          onClick={() => handleStatusChange('')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            !statusFilter
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
          }`}
        >
          All
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleStatusChange(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s
                ? STATUS_COLORS[s] ?? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Tasks Table */}
      <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800/60 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Task ID</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitter</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Miner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No inference tasks found.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.taskId} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/task/${task.taskId}`}
                      className="font-mono text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      {shortenHash(task.taskId, 8, 6)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                    {task.modelId}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[task.status] ?? 'bg-slate-500/10 text-slate-400'}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/address/${task.submitter}`}
                      className="font-mono text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      {shortenHash(task.submitter)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                    {formatQfcAmount(task.maxFee)} QFC
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatTime(task.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {task.minerAddress ? (
                      <Link
                        href={`/address/${task.minerAddress}`}
                        className="font-mono text-xs text-cyan-400 hover:text-cyan-300"
                      >
                        {shortenHash(task.minerAddress)}
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4">
        <TranslatedPagination
          basePath="/inference/tasks"
          page={page}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          prevHref={hasPrevious ? buildHref(page - 1) : undefined}
          nextHref={hasNext ? buildHref(page + 1) : undefined}
        />
      </div>
    </>
  );
}
