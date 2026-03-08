'use client';

import { useRef, useCallback } from 'react';
import type { DiffHunk, DiffStats } from '@/lib/api-types';

type DiffViewProps = {
  hunks: DiffHunk[];
  stats: DiffStats;
};

export default function DiffView({ hunks, stats }: DiffViewProps) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  const handleScroll = useCallback((source: 'left' | 'right') => {
    if (syncing.current) return;
    syncing.current = true;
    const from = source === 'left' ? leftRef.current : rightRef.current;
    const to = source === 'left' ? rightRef.current : leftRef.current;
    if (from && to) {
      to.scrollTop = from.scrollTop;
      to.scrollLeft = from.scrollLeft;
    }
    syncing.current = false;
  }, []);

  if (hunks.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <p className="text-slate-400">No differences found. The source code is identical.</p>
        <div className="mt-2 text-sm text-slate-500">
          {stats.unchanged} unchanged lines
        </div>
      </div>
    );
  }

  // Build line arrays for left and right panels
  type PanelLine = { lineNum: number | null; content: string; type: 'same' | 'added' | 'removed' | 'hunk-header' };
  const leftLines: PanelLine[] = [];
  const rightLines: PanelLine[] = [];

  for (let hi = 0; hi < hunks.length; hi++) {
    const hunk = hunks[hi];

    if (hi > 0) {
      leftLines.push({ lineNum: null, content: '...', type: 'hunk-header' });
      rightLines.push({ lineNum: null, content: '...', type: 'hunk-header' });
    }

    let aLine = hunk.a_start;
    let bLine = hunk.b_start;

    for (const line of hunk.lines) {
      if (line.type === 'same') {
        leftLines.push({ lineNum: aLine++, content: line.content, type: 'same' });
        rightLines.push({ lineNum: bLine++, content: line.content, type: 'same' });
      } else if (line.type === 'removed') {
        leftLines.push({ lineNum: aLine++, content: line.content, type: 'removed' });
        rightLines.push({ lineNum: null, content: '', type: 'removed' });
      } else if (line.type === 'added') {
        leftLines.push({ lineNum: null, content: '', type: 'added' });
        rightLines.push({ lineNum: bLine++, content: line.content, type: 'added' });
      }
    }
  }

  const bgClass = (type: PanelLine['type'], side: 'left' | 'right') => {
    if (type === 'hunk-header') return 'bg-slate-800/50';
    if (type === 'removed') return side === 'left' ? 'bg-red-500/15' : 'bg-red-500/5';
    if (type === 'added') return side === 'right' ? 'bg-green-500/15' : 'bg-green-500/5';
    return '';
  };

  const textClass = (type: PanelLine['type'], side: 'left' | 'right') => {
    if (type === 'hunk-header') return 'text-slate-600 italic';
    if (type === 'removed' && side === 'left') return 'text-red-300';
    if (type === 'added' && side === 'right') return 'text-green-300';
    return 'text-slate-300';
  };

  const renderPanel = (
    lines: PanelLine[],
    side: 'left' | 'right',
    ref: React.RefObject<HTMLDivElement | null>,
  ) => (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="flex-1 min-w-0 overflow-auto max-h-[600px] border border-slate-800 rounded-lg"
      onScroll={() => handleScroll(side)}
    >
      <table className="w-full text-xs font-mono">
        <tbody>
          {lines.map((line, idx) => (
            <tr key={idx} className={bgClass(line.type, side)}>
              <td className="select-none w-12 px-2 py-0.5 text-right text-slate-600 border-r border-slate-800/50">
                {line.lineNum ?? ''}
              </td>
              <td className={`px-3 py-0.5 whitespace-pre ${textClass(line.type, side)}`}>
                {line.content}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-green-400">+{stats.additions} additions</span>
        <span className="text-red-400">-{stats.deletions} deletions</span>
        <span className="text-slate-500">{stats.unchanged} unchanged</span>
      </div>

      {/* Side-by-side diff */}
      <div className="flex gap-2">
        {renderPanel(leftLines, 'left', leftRef)}
        {renderPanel(rightLines, 'right', rightRef)}
      </div>
    </div>
  );
}
