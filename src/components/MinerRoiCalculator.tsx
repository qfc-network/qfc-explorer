'use client';

import { useState, useMemo } from 'react';

type Props = {
  totalEarned: string;
  earnings: Array<{ reward: string; timestamp: string }>;
};

function hexWeiToNumber(hexWei: string): number {
  try {
    const wei = BigInt(hexWei.startsWith('0x') ? hexWei : `0x${hexWei}`);
    const whole = Number(wei / 10n ** 18n);
    const frac = Number(wei % 10n ** 18n) / 1e18;
    return whole + frac;
  } catch {
    return 0;
  }
}

export default function MinerRoiCalculator({ totalEarned, earnings }: Props) {
  const [collapsed, setCollapsed] = useState(true);
  const [electricityCost, setElectricityCost] = useState(0.12);
  const [gpuPower, setGpuPower] = useState(250);
  const [hardwareCost, setHardwareCost] = useState(1000);
  const [qfcPrice, setQfcPrice] = useState(0.01);

  const calculations = useMemo(() => {
    // Calculate average daily revenue from earnings data
    if (!earnings || earnings.length < 2) {
      return null;
    }

    const timestamps = earnings.map((e) => Number(e.timestamp)).sort((a, b) => a - b);
    const totalQfc = earnings.reduce((sum, e) => sum + hexWeiToNumber(e.reward), 0);
    const timeSpanMs = timestamps[timestamps.length - 1] - timestamps[0];
    const timeSpanDays = timeSpanMs / (1000 * 60 * 60 * 24);

    if (timeSpanDays <= 0) return null;

    const dailyRevenueQfc = totalQfc / timeSpanDays;
    const dailyRevenueUsd = dailyRevenueQfc * qfcPrice;

    // Electricity cost: watts / 1000 * 24h * $/kWh
    const dailyElectricityCost = (gpuPower / 1000) * 24 * electricityCost;
    const dailyNetProfit = dailyRevenueUsd - dailyElectricityCost;
    const monthlyProjection = dailyNetProfit * 30;

    // Payback period
    const paybackDays = dailyNetProfit > 0 ? hardwareCost / dailyNetProfit : Infinity;

    return {
      dailyRevenueQfc,
      dailyRevenueUsd,
      dailyElectricityCost,
      dailyNetProfit,
      monthlyProjection,
      paybackDays,
      timeSpanDays,
    };
  }, [earnings, electricityCost, gpuPower, hardwareCost, qfcPrice]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
      {/* Collapsible header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-2xl"
      >
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">ROI Calculator</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Estimate your mining profitability</p>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <div className="px-5 pb-5 border-t border-slate-200 dark:border-slate-800 pt-4">
          {/* Input fields */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Electricity Cost ($/kWh)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={electricityCost}
                onChange={(e) => setElectricityCost(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                GPU Power Draw (W)
              </label>
              <input
                type="number"
                step="10"
                min="0"
                value={gpuPower}
                onChange={(e) => setGpuPower(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Hardware Cost ($)
              </label>
              <input
                type="number"
                step="100"
                min="0"
                value={hardwareCost}
                onChange={(e) => setHardwareCost(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                QFC Price ($)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={qfcPrice}
                onChange={(e) => setQfcPrice(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Results */}
          {calculations ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ResultCard
                label="Daily Revenue"
                primary={`${calculations.dailyRevenueQfc.toFixed(4)} QFC`}
                secondary={`$${calculations.dailyRevenueUsd.toFixed(4)}`}
              />
              <ResultCard
                label="Daily Electricity"
                primary={`-$${calculations.dailyElectricityCost.toFixed(4)}`}
                negative
              />
              <ResultCard
                label="Daily Net Profit"
                primary={`$${calculations.dailyNetProfit.toFixed(4)}`}
                positive={calculations.dailyNetProfit > 0}
                negative={calculations.dailyNetProfit <= 0}
              />
              <ResultCard
                label="Monthly Projection"
                primary={`$${calculations.monthlyProjection.toFixed(2)}`}
                positive={calculations.monthlyProjection > 0}
                negative={calculations.monthlyProjection <= 0}
              />
              <ResultCard
                label="Payback Period"
                primary={
                  calculations.paybackDays === Infinity
                    ? 'Never (negative ROI)'
                    : `${Math.ceil(calculations.paybackDays)} days`
                }
                secondary={
                  calculations.paybackDays !== Infinity
                    ? `~${(calculations.paybackDays / 30).toFixed(1)} months`
                    : undefined
                }
                negative={calculations.paybackDays === Infinity}
              />
              <ResultCard
                label="Based On"
                primary={`${calculations.timeSpanDays.toFixed(1)} days`}
                secondary={`${earnings.length} earnings recorded`}
              />
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
              Not enough earnings data to calculate ROI. At least 2 earnings entries with different timestamps are required.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({
  label,
  primary,
  secondary,
  positive,
  negative,
}: {
  label: string;
  primary: string;
  secondary?: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={`mt-1 text-lg font-bold ${
          positive
            ? 'text-emerald-600 dark:text-emerald-400'
            : negative
              ? 'text-red-500 dark:text-red-400'
              : 'text-slate-900 dark:text-white'
        }`}
      >
        {primary}
      </p>
      {secondary && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{secondary}</p>
      )}
    </div>
  );
}
