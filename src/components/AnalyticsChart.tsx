'use client';

import { useMemo } from 'react';

type DataPoint = {
  label: string;
  value: number;
  timestamp?: number;
};

type Props = {
  data: DataPoint[];
  color?: string;
  height?: number;
  yAxisLabel?: string;
};

export default function AnalyticsChart({
  data,
  color = '#22c55e',
  height = 200,
  yAxisLabel = '',
}: Props) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], maxValue: 0, minValue: 0 };
    }

    const values = data.map((d) => d.value);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;

    const points = data.map((d, i) => ({
      x: (i / (data.length - 1 || 1)) * 100,
      y: ((d.value - minValue) / range) * 100,
      label: d.label,
      value: d.value,
    }));

    return { points, maxValue, minValue };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-500"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  const { points, maxValue, minValue } = chartData;

  // Create SVG path for the line
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${100 - p.y}`)
    .join(' ');

  // Create path for the area fill
  const areaPath = `${linePath} L ${points[points.length - 1].x} 100 L 0 100 Z`;

  // Y-axis labels
  const yLabels = [
    { value: maxValue, y: 0 },
    { value: (maxValue + minValue) / 2, y: 50 },
    { value: minValue, y: 100 },
  ];

  // X-axis labels (show every 10th label)
  const xLabels = points.filter((_, i) => i % Math.ceil(points.length / 10) === 0 || i === points.length - 1);

  return (
    <div style={{ height }} className="relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-8 flex w-16 flex-col justify-between text-right text-xs text-slate-500 pr-2">
        {yLabels.map((l, i) => (
          <span key={i}>{formatAxisValue(l.value)}{yAxisLabel ? ` ${yAxisLabel}` : ''}</span>
        ))}
      </div>

      {/* Chart area */}
      <div className="absolute left-16 right-0 top-0 bottom-8">
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          {/* Grid lines */}
          <line x1="0" y1="0" x2="100" y2="0" stroke="#334155" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1="0" y1="100" x2="100" y2="100" stroke="#334155" strokeWidth="0.5" />

          {/* Area fill */}
          <path
            d={areaPath}
            fill={`${color}20`}
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={100 - p.y}
                r="3"
                fill={color}
                className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              />
              <title>{`Block ${p.label}: ${formatAxisValue(p.value)}${yAxisLabel ? ` ${yAxisLabel}` : ''}`}</title>
            </g>
          ))}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="absolute left-16 right-0 bottom-0 h-8 flex justify-between text-xs text-slate-500">
        {xLabels.map((p, i) => (
          <span key={i} className="text-center" style={{ width: '60px', marginLeft: i === 0 ? 0 : '-30px' }}>
            #{p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function formatAxisValue(value: number): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  if (value < 1 && value > 0) {
    return value.toFixed(2);
  }
  return value.toFixed(0);
}
