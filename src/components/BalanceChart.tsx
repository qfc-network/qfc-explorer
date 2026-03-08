'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '@/components/LocaleProvider';
import { getApiBaseUrl } from '@/lib/api-client';
import type { ApiBalanceHistory, BalanceHistoryPoint } from '@/lib/api-types';

type Days = 7 | 30 | 90 | 365;

function weiToQfc(wei: string): number {
  try {
    if (!wei || wei === '0') return 0;
    const n = BigInt(wei);
    // Convert to number with 18 decimals precision
    const whole = Number(n / 1000000000000000000n);
    const frac = Number(n % 1000000000000000000n) / 1e18;
    return whole + frac;
  } catch {
    return 0;
  }
}

function formatQfc(value: number): string {
  if (value === 0) return '0';
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  if (value >= 1) return value.toFixed(2);
  if (value >= 0.001) return value.toFixed(4);
  return value.toExponential(2);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function BalanceChart({ address }: { address: string }) {
  const { t } = useTranslation();
  const [days, setDays] = useState<Days>(30);
  const [points, setPoints] = useState<BalanceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hover, setHover] = useState<{ x: number; idx: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const fetchData = useCallback(async (d: Days) => {
    setLoading(true);
    setError(false);
    try {
      const base = getApiBaseUrl();
      const isExternal = base.includes(':3001') ||
        (process.env.NEXT_PUBLIC_API_URL || '').length > 0;
      const prefix = isExternal ? '' : '/api';
      const url = `${base}${prefix}/address/${address}/balance-history?days=${d}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      const json = (await res.json()) as ApiBalanceHistory;
      if (json.ok && json.data.points.length > 0) {
        setPoints(json.data.points);
      } else {
        setPoints([]);
      }
    } catch {
      setError(true);
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchData(days);
  }, [days, fetchData]);

  const handleZoom = (d: Days) => {
    setDays(d);
    setHover(null);
  };

  // Chart dimensions
  const W = 800;
  const H = 300;
  const PAD_LEFT = 80;
  const PAD_RIGHT = 20;
  const PAD_TOP = 20;
  const PAD_BOTTOM = 40;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  // Convert points to QFC values
  const qfcValues = points.map((p) => weiToQfc(p.balance));
  const minVal = qfcValues.length > 0 ? Math.min(...qfcValues) : 0;
  const maxVal = qfcValues.length > 0 ? Math.max(...qfcValues) : 0;
  const range = maxVal - minVal || 1;

  // Compute SVG coordinates
  const coords = qfcValues.map((val, i) => ({
    x: PAD_LEFT + (points.length > 1 ? (i / (points.length - 1)) * chartW : chartW / 2),
    y: PAD_TOP + chartH - ((val - minVal) / range) * chartH,
  }));

  // Build polyline points string
  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');

  // Build area path (fill under line)
  const areaPath = coords.length > 0
    ? `M ${coords[0].x},${PAD_TOP + chartH} ` +
      coords.map((c) => `L ${c.x},${c.y}`).join(' ') +
      ` L ${coords[coords.length - 1].x},${PAD_TOP + chartH} Z`
    : '';

  // Y-axis ticks (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = minVal + (range * i) / 4;
    const y = PAD_TOP + chartH - (i / 4) * chartH;
    return { val, y };
  });

  // X-axis labels (max 6)
  const xLabelCount = Math.min(6, points.length);
  const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
    const idx = points.length > 1
      ? Math.round((i / (xLabelCount - 1)) * (points.length - 1))
      : 0;
    return {
      label: formatDate(points[idx]?.date ?? ''),
      x: coords[idx]?.x ?? 0,
    };
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || coords.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    // Find closest point
    let closest = 0;
    let closestDist = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const dist = Math.abs(coords[i].x - mouseX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    }
    if (mouseX >= PAD_LEFT && mouseX <= W - PAD_RIGHT) {
      setHover({ x: coords[closest].x, idx: closest });
    } else {
      setHover(null);
    }
  };

  const zoomButtons: { label: string; value: Days }[] = [
    { label: t('balance.7d'), value: 7 },
    { label: t('balance.30d'), value: 30 },
    { label: t('balance.90d'), value: 90 },
    { label: t('balance.1y'), value: 365 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        {t('common.loading')}
      </div>
    );
  }

  if (error || points.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        {t('balance.noData')}
      </div>
    );
  }

  return (
    <div>
      {/* Zoom buttons */}
      <div className="mb-3 flex gap-2">
        {zoomButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => handleZoom(btn.value)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              days === btn.value
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* SVG Chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="balanceAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4fc3f7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4fc3f7" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={PAD_LEFT}
              y1={tick.y}
              x2={W - PAD_RIGHT}
              y2={tick.y}
              stroke="#334155"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
            <text
              x={PAD_LEFT - 8}
              y={tick.y + 4}
              textAnchor="end"
              fill="#94a3b8"
              fontSize="11"
            >
              {formatQfc(tick.val)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map((lbl, i) => (
          <text
            key={i}
            x={lbl.x}
            y={H - 8}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
          >
            {lbl.label}
          </text>
        ))}

        {/* Area fill */}
        {areaPath && (
          <path d={areaPath} fill="url(#balanceAreaGrad)" />
        )}

        {/* Line */}
        {coords.length > 1 && (
          <polyline
            points={linePoints}
            fill="none"
            stroke="#4fc3f7"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Single point dot */}
        {coords.length === 1 && (
          <circle cx={coords[0].x} cy={coords[0].y} r="4" fill="#4fc3f7" />
        )}

        {/* Hover crosshair + tooltip */}
        {hover !== null && coords[hover.idx] && (
          <g>
            {/* Vertical line */}
            <line
              x1={hover.x}
              y1={PAD_TOP}
              x2={hover.x}
              y2={PAD_TOP + chartH}
              stroke="#4fc3f7"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.6"
            />
            {/* Dot */}
            <circle
              cx={coords[hover.idx].x}
              cy={coords[hover.idx].y}
              r="4"
              fill="#4fc3f7"
              stroke="#0a1628"
              strokeWidth="2"
            />
            {/* Tooltip background */}
            <rect
              x={Math.min(coords[hover.idx].x - 70, W - PAD_RIGHT - 145)}
              y={Math.max(coords[hover.idx].y - 52, PAD_TOP)}
              width="140"
              height="42"
              rx="4"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1"
            />
            {/* Tooltip text - date */}
            <text
              x={Math.min(coords[hover.idx].x - 70, W - PAD_RIGHT - 145) + 8}
              y={Math.max(coords[hover.idx].y - 52, PAD_TOP) + 16}
              fill="#94a3b8"
              fontSize="11"
            >
              {points[hover.idx]?.date}
            </text>
            {/* Tooltip text - balance */}
            <text
              x={Math.min(coords[hover.idx].x - 70, W - PAD_RIGHT - 145) + 8}
              y={Math.max(coords[hover.idx].y - 52, PAD_TOP) + 34}
              fill="#4fc3f7"
              fontSize="12"
              fontWeight="600"
            >
              {formatQfc(qfcValues[hover.idx])} QFC
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
