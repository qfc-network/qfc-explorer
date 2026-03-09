'use client';

import { useMemo } from 'react';

type Props = {
  score: string;
  maxScore?: number;
};

export default function MinerScoreGauge({ score, maxScore = 1000 }: Props) {
  const numericScore = Number(score) || 0;

  const { color, label, strokeDasharray, strokeDashoffset } = useMemo(() => {
    const pct = Math.min(numericScore / maxScore, 1);

    // Color zones: red (0-33%) -> yellow (33-66%) -> green (66-100%)
    let color: string;
    let label: string;
    if (pct < 0.33) {
      color = '#ef4444'; // red-500
      label = 'Low';
    } else if (pct < 0.66) {
      color = '#eab308'; // yellow-500
      label = 'Medium';
    } else {
      color = '#22c55e'; // green-500
      label = 'High';
    }

    // SVG circle math: radius=45, circumference = 2*pi*45 = ~282.74
    // We draw a 270-degree arc (3/4 of circle)
    const circumference = 2 * Math.PI * 45;
    const arcLength = circumference * 0.75; // 270 degrees
    const filledLength = arcLength * pct;

    return {
      color,
      label,
      strokeDasharray: `${arcLength} ${circumference}`,
      strokeDashoffset: -(arcLength - filledLength),
    };
  }, [numericScore, maxScore]);

  const circumference = 2 * Math.PI * 45;
  const arcLength = circumference * 0.75;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Contribution Score</h3>

      <div className="flex flex-col items-center">
        <svg width="160" height="140" viewBox="0 0 120 110" className="overflow-visible">
          {/* Background arc */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            transform="rotate(135 60 60)"
          />

          {/* Filled arc */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${arcLength * Math.min(numericScore / maxScore, 1)} ${circumference}`}
            transform="rotate(135 60 60)"
            className="transition-all duration-700"
          />

          {/* Score text */}
          <text
            x="60"
            y="55"
            textAnchor="middle"
            className="fill-slate-900 dark:fill-white text-2xl font-bold"
            style={{ fontSize: '24px', fontWeight: 700 }}
          >
            {numericScore}
          </text>

          {/* Label */}
          <text
            x="60"
            y="75"
            textAnchor="middle"
            fill={color}
            style={{ fontSize: '11px', fontWeight: 600 }}
          >
            {label}
          </text>

          {/* Min/Max labels */}
          <text
            x="12"
            y="100"
            textAnchor="middle"
            className="fill-slate-400 dark:fill-slate-500"
            style={{ fontSize: '9px' }}
          >
            0
          </text>
          <text
            x="108"
            y="100"
            textAnchor="middle"
            className="fill-slate-400 dark:fill-slate-500"
            style={{ fontSize: '9px' }}
          >
            {maxScore}
          </text>
        </svg>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          out of {maxScore} max
        </p>
      </div>
    </div>
  );
}
