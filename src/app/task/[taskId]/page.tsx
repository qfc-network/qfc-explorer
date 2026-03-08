export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiTaskStatus } from '@/lib/api-types';
import { formatWeiToQfc } from '@/lib/format';
import CopyButton from '@/components/CopyButton';

export async function generateMetadata({ params }: { params: { taskId: string } }): Promise<Metadata> {
  return { title: `Inference Task ${params.taskId}` };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  Pending:   { label: 'Pending',   color: 'bg-yellow-500/10 text-yellow-400', dotColor: 'bg-yellow-400' },
  Assigned:  { label: 'Assigned',  color: 'bg-blue-500/10 text-blue-400',     dotColor: 'bg-blue-400' },
  Completed: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-400', dotColor: 'bg-emerald-400' },
  Failed:    { label: 'Failed',    color: 'bg-red-500/10 text-red-400',       dotColor: 'bg-red-400' },
  Expired:   { label: 'Expired',   color: 'bg-slate-500/10 text-slate-400',   dotColor: 'bg-slate-400' },
};

export default async function TaskDetailPage({
  params,
}: {
  params: { taskId: string };
}) {
  const { taskId } = params;
  const response = await fetchJsonSafe<ApiTaskStatus>(
    `/api/inference/task?id=${taskId}`,
    { next: { revalidate: 5 } }
  );

  const task = response?.data ?? null;

  if (!task) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
          <p className="text-lg text-white">Task not found</p>
          <p className="mt-2 text-sm text-slate-400 font-mono break-all">{taskId}</p>
          <Link href="/" className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const statusCfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.Pending;
  const createdAt = task.createdAt ? new Date(task.createdAt * 1000) : null;
  const deadline = task.deadline ? new Date(task.deadline * 1000) : null;
  const isCompleted = task.status === 'Completed';
  const isFailed = task.status === 'Failed';
  const isExpired = task.status === 'Expired';
  const isFinal = isCompleted || isFailed || isExpired;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold text-white">Inference Task</h1>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusCfg.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotColor}`} />
          {statusCfg.label}
        </span>
      </div>

      {/* Status Timeline */}
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4">
        <div className="flex items-center gap-0">
          <TimelineStep label="Submitted" active completed />
          <TimelineConnector completed={task.status !== 'Pending'} />
          <TimelineStep
            label="Assigned"
            active={task.status !== 'Pending'}
            completed={task.status !== 'Pending' && task.status !== 'Expired'}
          />
          <TimelineConnector completed={isFinal} />
          <TimelineStep
            label={isFailed ? 'Failed' : isExpired ? 'Expired' : 'Completed'}
            active={isFinal}
            completed={isCompleted}
            failed={isFailed || isExpired}
          />
        </div>
      </div>

      {/* Overview */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 divide-y divide-slate-800/40">
        <Row label="Task ID">
          <span className="font-mono text-sm text-white break-all">{task.taskId}</span>
          <CopyButton value={task.taskId} label="Copy" />
        </Row>
        <Row label="Status">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusCfg.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotColor}`} />
            {statusCfg.label}
          </span>
        </Row>
        <Row label="Task Type">
          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300 font-mono">{task.taskType}</span>
        </Row>
        <Row label="Model">
          <span className="text-slate-300 font-mono text-sm">{task.modelId}</span>
        </Row>
        <Row label="Submitter">
          <Link href={`/address/${task.submitter}`} className="font-mono text-sm text-cyan-400 hover:text-cyan-300">
            {task.submitter}
          </Link>
          <CopyButton value={task.submitter} label="Copy" />
        </Row>
        <Row label="Max Fee">
          <span className="text-white font-medium">{formatWeiToQfc(task.maxFee)} QFC</span>
        </Row>
        {createdAt && (
          <Row label="Created">
            <span className="text-slate-300">{createdAt.toLocaleString()}</span>
          </Row>
        )}
        {deadline && (
          <Row label="Deadline">
            <span className="text-slate-300">{deadline.toLocaleString()}</span>
            {!isFinal && deadline.getTime() < Date.now() && (
              <span className="text-xs text-red-400 ml-2">expired</span>
            )}
          </Row>
        )}
        {task.minerAddress && (
          <Row label="Miner">
            <Link href={`/address/${task.minerAddress}`} className="font-mono text-sm text-cyan-400 hover:text-cyan-300">
              {task.minerAddress}
            </Link>
            <CopyButton value={task.minerAddress} label="Copy" />
          </Row>
        )}
        {task.executionTimeMs != null && (
          <Row label="Execution Time">
            <span className="text-slate-300">{task.executionTimeMs.toLocaleString()} ms</span>
          </Row>
        )}
      </div>

      {/* Result */}
      {task.result && (
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between border-b border-slate-800/40 px-5 py-3">
            <h2 className="text-sm font-semibold text-white">Result</h2>
            {task.resultSize != null && (
              <span className="text-xs text-slate-500">{task.resultSize.toLocaleString()} bytes</span>
            )}
          </div>
          <div className="p-5">
            <pre className="whitespace-pre-wrap break-all font-mono text-xs text-slate-300 bg-slate-800 rounded-lg p-4 max-h-96 overflow-auto">
              {tryFormatJson(task.result)}
            </pre>
          </div>
        </div>
      )}
    </main>
  );
}

function tryFormatJson(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-4">
      <span className="shrink-0 text-xs uppercase tracking-wider text-slate-500 sm:w-36">{label}</span>
      <div className="flex flex-wrap items-center gap-2 min-w-0">{children}</div>
    </div>
  );
}

function TimelineStep({ label, active, completed, failed }: { label: string; active: boolean; completed: boolean; failed?: boolean }) {
  const dotColor = failed
    ? 'bg-red-400 border-red-400/30'
    : completed
    ? 'bg-emerald-400 border-emerald-400/30'
    : active
    ? 'bg-cyan-400 border-cyan-400/30'
    : 'bg-slate-700 border-slate-700';
  const textColor = failed
    ? 'text-red-400'
    : completed
    ? 'text-emerald-400'
    : active
    ? 'text-cyan-400'
    : 'text-slate-600';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`h-3 w-3 rounded-full border-2 ${dotColor}`} />
      <span className={`text-[10px] font-medium uppercase tracking-wider ${textColor}`}>{label}</span>
    </div>
  );
}

function TimelineConnector({ completed }: { completed: boolean }) {
  return (
    <div className={`mx-1 h-0.5 flex-1 rounded-full ${completed ? 'bg-emerald-400/40' : 'bg-slate-700'}`} />
  );
}
