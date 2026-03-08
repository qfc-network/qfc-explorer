'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/components/LocaleProvider';
import { getApiBaseUrl } from '@/lib/api-client';

type DayData = { date: string; count: number };

type ApiActivityResponse = {
  ok: boolean;
  data: { days: DayData[] };
};

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

const LEVEL_COLORS = [
  '#1a2332', // 0: empty
  '#0e4429', // 1: low (1-2)
  '#006d32', // 2: med (3-5)
  '#26a641', // 3: high (6-10)
  '#39d353', // 4: max (11+)
];

const CELL_SIZE = 12;
const CELL_GAP = 2;

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short' });
}

export default function ActivityHeatmap({ address }: { address: string }) {
  const { t } = useTranslation();
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; count: number } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const base = getApiBaseUrl();
      const isExternal = base.includes(':3001') ||
        (process.env.NEXT_PUBLIC_API_URL || '').length > 0;
      const prefix = isExternal ? '' : '/api';
      const url = `${base}${prefix}/address/${address}/activity`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      const json = (await res.json()) as ApiActivityResponse;
      if (json.ok) {
        setDays(json.data.days);
      } else {
        setDays([]);
      }
    } catch {
      setError(true);
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-slate-400">
        {t('common.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 text-center text-sm text-slate-500">
        {t('activity.noData')}
      </div>
    );
  }

  // Build a map of date -> count
  const countMap = new Map<string, number>();
  for (const d of days) {
    countMap.set(d.date, d.count);
  }

  // Build 53 weeks x 7 days grid, ending today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the start: go back ~52 weeks to the nearest Sunday
  const endDay = new Date(today);
  const startDay = new Date(today);
  startDay.setDate(startDay.getDate() - 364); // 365 days including today
  // Align to Sunday (start of week)
  const startDow = startDay.getDay(); // 0=Sun
  startDay.setDate(startDay.getDate() - startDow);

  // Build cells
  type Cell = { date: string; count: number; col: number; row: number };
  const cells: Cell[] = [];
  const d = new Date(startDay);
  let col = 0;

  while (d <= endDay) {
    const row = d.getDay(); // 0=Sun, 6=Sat
    const dateStr = d.toISOString().slice(0, 10);
    const count = countMap.get(dateStr) ?? 0;
    cells.push({ date: dateStr, count, col, row });

    // Move to next day
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 && d <= endDay) {
      col++;
    }
  }

  const totalCols = col + 1;

  // Build month labels
  type MonthLabel = { label: string; col: number };
  const monthLabels: MonthLabel[] = [];
  let lastMonth = -1;
  for (const cell of cells) {
    if (cell.row === 0) {
      const cellDate = new Date(cell.date);
      const month = cellDate.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ label: getMonthLabel(cellDate), col: cell.col });
        lastMonth = month;
      }
    }
  }

  // Day labels (Mon, Wed, Fri)
  const dayLabels = [
    { label: t('activity.mon'), row: 1 },
    { label: t('activity.wed'), row: 3 },
    { label: t('activity.fri'), row: 5 },
  ];

  const gridLeft = 32; // space for day labels
  const gridTop = 20; // space for month labels
  const gridWidth = totalCols * (CELL_SIZE + CELL_GAP);
  const gridHeight = 7 * (CELL_SIZE + CELL_GAP);

  // Total count
  const totalTxs = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {t('activity.totalTransactions').replace('{count}', String(totalTxs))}
        </span>
        {/* Legend */}
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <span>{t('activity.less')}</span>
          {LEVEL_COLORS.map((color, i) => (
            <div
              key={i}
              style={{ width: CELL_SIZE, height: CELL_SIZE, backgroundColor: color, borderRadius: 2 }}
            />
          ))}
          <span>{t('activity.more')}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          style={{ width: gridLeft + gridWidth + 8, minWidth: gridLeft + gridWidth + 8 }}
          className="relative"
        >
          {/* Month labels */}
          {monthLabels.map((ml, i) => (
            <span
              key={i}
              className="absolute text-[10px] text-slate-400"
              style={{
                left: gridLeft + ml.col * (CELL_SIZE + CELL_GAP),
                top: 0,
              }}
            >
              {ml.label}
            </span>
          ))}

          {/* Day labels */}
          {dayLabels.map((dl, i) => (
            <span
              key={i}
              className="absolute text-[10px] text-slate-400"
              style={{
                left: 0,
                top: gridTop + dl.row * (CELL_SIZE + CELL_GAP) + 1,
              }}
            >
              {dl.label}
            </span>
          ))}

          {/* Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
              gridAutoFlow: 'column',
              gridAutoColumns: `${CELL_SIZE}px`,
              gap: `${CELL_GAP}px`,
              marginLeft: gridLeft,
              marginTop: gridTop,
            }}
          >
            {cells.map((cell, i) => (
              <div
                key={i}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: LEVEL_COLORS[getLevel(cell.count)],
                  borderRadius: 2,
                  gridRow: cell.row + 1,
                  gridColumn: cell.col + 1,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                    date: cell.date,
                    count: cell.count,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y - 36,
            transform: 'translateX(-50%)',
          }}
        >
          <span className="font-medium">{tooltip.count}</span>{' '}
          {t('activity.transactions')} — {tooltip.date}
        </div>
      )}
    </div>
  );
}
