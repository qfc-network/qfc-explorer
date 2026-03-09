'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/LocaleProvider';
import { shortenHash } from '@/lib/format';

/* ── Types ── */

interface Holder {
  address: string;
  balance: string;
}

interface HolderDistributionProps {
  holders: Holder[];
  tokenDecimals: number | null;
  tokenSymbol: string | null;
  totalSupply: string | null;
}

/* ── Color palette (10 distinct colors for dark backgrounds) ── */

const SLICE_COLORS = [
  '#4fc3f7', // cyan (brand primary)
  '#ab47bc', // purple
  '#66bb6a', // green
  '#ffa726', // orange
  '#ef5350', // red
  '#42a5f5', // blue
  '#ec407a', // pink
  '#26c6da', // teal
  '#ffee58', // yellow
  '#8d6e63', // brown
];
const OTHERS_COLOR = '#546e7a'; // blue-grey for "Others"

/* ── Helpers ── */

function formatTokenValue(value: string, decimals: number | null): string {
  if (!value) return '0';
  try {
    const val = BigInt(value);
    const dec = decimals ?? 18;
    const base = 10n ** BigInt(dec);
    const whole = val / base;
    const frac = val % base;
    const wholeStr = whole.toLocaleString('en-US');
    if (frac === 0n) return wholeStr;
    const fracStr = frac.toString().padStart(dec, '0').slice(0, 4).replace(/0+$/, '');
    return `${wholeStr}.${fracStr}`;
  } catch {
    return value;
  }
}

function formatSupplyCenter(supply: string | null, decimals: number | null): string {
  if (!supply) return '—';
  try {
    const val = BigInt(supply);
    const dec = decimals ?? 18;
    const base = 10n ** BigInt(dec);
    const whole = Number(val / base);
    if (whole >= 1_000_000_000) return `${(whole / 1_000_000_000).toFixed(2)}B`;
    if (whole >= 1_000_000) return `${(whole / 1_000_000).toFixed(2)}M`;
    if (whole >= 1_000) return `${(whole / 1_000).toFixed(2)}K`;
    return whole.toLocaleString('en-US');
  } catch {
    return supply;
  }
}

/* ── Arc path helper ── */

function describeArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  // Clamp near-full circles to avoid SVG rendering glitches
  const sweep = endAngle - startAngle;
  const largeArc = sweep > Math.PI ? 1 : 0;

  const outerStartX = cx + outerR * Math.cos(startAngle);
  const outerStartY = cy + outerR * Math.sin(startAngle);
  const outerEndX = cx + outerR * Math.cos(endAngle);
  const outerEndY = cy + outerR * Math.sin(endAngle);

  const innerStartX = cx + innerR * Math.cos(endAngle);
  const innerStartY = cy + innerR * Math.sin(endAngle);
  const innerEndX = cx + innerR * Math.cos(startAngle);
  const innerEndY = cy + innerR * Math.sin(startAngle);

  return [
    `M ${outerStartX} ${outerStartY}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEndX} ${outerEndY}`,
    `L ${innerStartX} ${innerStartY}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEndX} ${innerEndY}`,
    'Z',
  ].join(' ');
}

/* ── Component ── */

export default function HolderDistribution({
  holders,
  tokenDecimals,
  tokenSymbol,
  totalSupply,
}: HolderDistributionProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const slices = useMemo(() => {
    if (holders.length === 0) return [];

    const totalBalance = holders.reduce((sum, h) => {
      try {
        return sum + BigInt(h.balance);
      } catch {
        return sum;
      }
    }, 0n);

    if (totalBalance === 0n) return [];

    const top = holders.slice(0, 10);
    let topTotal = 0n;
    const items = top.map((h, i) => {
      const bal = BigInt(h.balance);
      topTotal += bal;
      const pct = Number((bal * 10000n) / totalBalance) / 100;
      return {
        address: h.address,
        balance: h.balance,
        percentage: pct,
        color: SLICE_COLORS[i % SLICE_COLORS.length],
        label: shortenHash(h.address, 6, 4),
      };
    });

    // "Others" slice
    if (holders.length > 10) {
      const othersBalance = totalBalance - topTotal;
      if (othersBalance > 0n) {
        const pct = Number((othersBalance * 10000n) / totalBalance) / 100;
        items.push({
          address: '',
          balance: othersBalance.toString(),
          percentage: pct,
          color: OTHERS_COLOR,
          label: t('token.distribution.others'),
        });
      }
    }

    return items;
  }, [holders, t]);

  if (holders.length === 0) return null;

  // Edge case: single holder
  if (slices.length === 0) return null;

  /* ── SVG geometry ── */
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 110;
  const innerR = 65;

  // Build paths from cumulative angles
  let cumAngle = -Math.PI / 2; // start at top
  const paths = slices.map((slice, i) => {
    const sweepAngle = (slice.percentage / 100) * 2 * Math.PI;
    // For a full circle (100%), slightly reduce to avoid zero-length arc
    const effectiveSweep = sweepAngle >= 2 * Math.PI ? 2 * Math.PI - 0.001 : sweepAngle;
    const startAngle = cumAngle;
    const endAngle = cumAngle + effectiveSweep;
    cumAngle += sweepAngle;

    const midAngle = startAngle + effectiveSweep / 2;
    // Scale factor on hover
    const isHovered = hoveredIndex === i;
    const hoverOffset = isHovered ? 6 : 0;
    const offsetX = hoverOffset * Math.cos(midAngle);
    const offsetY = hoverOffset * Math.sin(midAngle);

    return {
      d: describeArc(cx, cy, outerR, innerR, startAngle, endAngle),
      color: slice.color,
      transform: `translate(${offsetX}, ${offsetY})`,
      isHovered,
      midAngle,
      index: i,
    };
  });

  const supplyDisplay = formatSupplyCenter(totalSupply, tokenDecimals);

  return (
    <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
        {t('token.distribution.title')}
      </h3>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Donut chart */}
        <div className="relative shrink-0">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-56 h-56 sm:w-60 sm:h-60"
          >
            {paths.map((p) => (
              <path
                key={p.index}
                d={p.d}
                fill={p.color}
                transform={p.transform}
                opacity={hoveredIndex === null || p.isHovered ? 1 : 0.4}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(p.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  const addr = slices[p.index].address;
                  if (addr) router.push(`/address/${addr}`);
                }}
              />
            ))}
            {/* Center text */}
            <text
              x={cx}
              y={cy - 8}
              textAnchor="middle"
              className="fill-slate-400 text-[10px]"
              style={{ fontSize: '10px' }}
            >
              {t('token.distribution.totalSupply')}
            </text>
            <text
              x={cx}
              y={cy + 10}
              textAnchor="middle"
              className="fill-white font-semibold text-[13px]"
              style={{ fontSize: '13px' }}
            >
              {supplyDisplay}
            </text>
            {tokenSymbol && (
              <text
                x={cx}
                y={cy + 24}
                textAnchor="middle"
                className="fill-slate-500 text-[10px]"
                style={{ fontSize: '10px' }}
              >
                {tokenSymbol}
              </text>
            )}
          </svg>

          {/* Tooltip */}
          {hoveredIndex !== null && (
            <div className="absolute pointer-events-none z-10 left-1/2 -translate-x-1/2 -top-2 -translate-y-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs shadow-lg whitespace-nowrap">
              <p className="font-mono text-cyan-400">{slices[hoveredIndex].label}</p>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                {formatTokenValue(slices[hoveredIndex].balance, tokenDecimals)}
                {tokenSymbol ? ` ${tokenSymbol}` : ''}
              </p>
              <p className="text-slate-400">{slices[hoveredIndex].percentage.toFixed(2)}%</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          {slices.map((slice, i) => (
            <button
              key={i}
              type="button"
              className={`flex items-center gap-2 text-left text-xs rounded px-1.5 py-1 transition-colors ${
                hoveredIndex === i ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
              } ${slice.address ? 'cursor-pointer' : 'cursor-default'}`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => {
                if (slice.address) router.push(`/address/${slice.address}`);
              }}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span className="font-mono text-slate-600 dark:text-slate-300 truncate">
                {slice.label}
              </span>
              <span className="ml-auto text-slate-500 shrink-0">
                {slice.percentage.toFixed(2)}%
              </span>
            </button>
          ))}
        </div>
      </div>

      {holders.length <= 1 && (
        <p className="mt-3 text-xs text-slate-500 text-center">
          {t('token.distribution.singleHolder')}
        </p>
      )}
    </div>
  );
}
