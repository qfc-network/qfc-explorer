'use client';

import { useState } from 'react';
import { apiUrl } from '@/lib/client-api';
import type { ApiTaskStatus } from '@/lib/api-types';
import { formatQfcAmount } from '@/lib/qfc-format';
import { shortenHash } from '@/lib/format';

type TaskData = ApiTaskStatus['data'];

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-500/20 text-yellow-300',
  Assigned: 'bg-blue-500/20 text-blue-300',
  Completed: 'bg-green-500/20 text-green-300',
  Expired: 'bg-slate-500/20 text-slate-400',
  Failed: 'bg-red-500/20 text-red-300',
};

export default function TaskLookup() {
  const [taskId, setTaskId] = useState('');
  const [task, setTask] = useState<TaskData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const id = taskId.trim();
    if (!id) return;

    setLoading(true);
    setError('');
    setTask(null);

    try {
      const res = await fetch(apiUrl(`/api/inference/task?id=${encodeURIComponent(id)}`));
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || 'Task not found');
      } else {
        setTask(json.data);
      }
    } catch {
      setError('Failed to fetch task status');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleLookup} className="flex gap-2">
        <input
          type="text"
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          placeholder="Enter task ID (hex hash)"
          className="flex-1 rounded-lg border border-slate-600 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !taskId.trim()}
          className="rounded-lg bg-cyan-600 px-5 py-2 text-sm font-medium text-slate-900 dark:text-white transition hover:bg-cyan-500 disabled:opacity-50"
        >
          {loading ? 'Looking up...' : 'Lookup'}
        </button>
      </form>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {task && (
        <div className="overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50">
          <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-700 px-4 py-3">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Task {shortenHash(task.taskId)}
            </span>
            <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[task.status] ?? 'bg-slate-500/20 text-slate-400'}`}>
              {task.status}
            </span>
          </div>
          <dl className="divide-y divide-slate-200 dark:divide-slate-700/50 text-sm">
            <Row label="Task Type" value={task.taskType} />
            <Row label="Model" value={task.modelId} />
            <Row label="Submitter" value={task.submitter} mono />
            <Row label="Max Fee" value={`${formatQfcAmount(task.maxFee)} QFC`} />
            <Row label="Created" value={new Date(task.createdAt).toLocaleString()} />
            <Row label="Deadline" value={new Date(task.deadline).toLocaleString()} />
            {task.minerAddress && (
              <Row label="Miner" value={task.minerAddress} mono />
            )}
            {task.executionTimeMs != null && (
              <Row label="Execution Time" value={`${task.executionTimeMs} ms`} />
            )}
            {task.resultSize != null && (
              <Row label="Result Size" value={`${task.resultSize} bytes`} />
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className={`text-slate-800 dark:text-slate-200 ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}
