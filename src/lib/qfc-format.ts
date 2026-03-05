export function formatQfcAmount(value: string): string {
  if (!value) {
    return '0';
  }
  const normalized = value.startsWith('0x') ? value.slice(2) : value;
  if (/^[0-9a-fA-F]+$/.test(normalized)) {
    try {
      const asBigInt = BigInt(`0x${normalized}`);
      return formatWithUnits(asBigInt, 18);
    } catch {
      return value;
    }
  }

  if (/^\d+$/.test(value)) {
    try {
      return formatWithUnits(BigInt(value), 18);
    } catch {
      return value;
    }
  }

  return value;
}

export function formatPercentage(value: string): string {
  if (!value) {
    return '0%';
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return value;
  }

  return `${numeric.toFixed(2)}%`;
}

function formatWithUnits(value: bigint, decimals: number): string {
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = value % base;
  if (fraction === 0n) {
    return formatBigInt(whole);
  }
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 4);
  return `${formatBigInt(whole)}.${fractionStr}`;
}

function formatBigInt(value: bigint): string {
  const raw = value.toString(10);
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format hashrate with appropriate unit (H/s, KH/s, MH/s, GH/s, TH/s)
 */
export function formatHashrate(value: string): string {
  if (!value || value === '0') {
    return '0 H/s';
  }

  try {
    const hashrate = BigInt(value);
    if (hashrate === 0n) {
      return '0 H/s';
    }

    const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s'];
    let unitIndex = 0;
    let displayValue = Number(hashrate);

    while (displayValue >= 1000 && unitIndex < units.length - 1) {
      displayValue /= 1000;
      unitIndex++;
    }

    // Format with appropriate decimal places
    const formatted = displayValue < 10
      ? displayValue.toFixed(2)
      : displayValue < 100
        ? displayValue.toFixed(1)
        : displayValue.toFixed(0);

    return `${formatted} ${units[unitIndex]}`;
  } catch {
    return value;
  }
}

/**
 * Format FLOPS with appropriate unit (FLOPS, KFLOPS, MFLOPS, GFLOPS, TFLOPS)
 */
export function formatFlops(value: string): string {
  if (!value || value === '0') {
    return '0 FLOPS';
  }

  try {
    const flops = Number(value);
    if (!Number.isFinite(flops) || flops === 0) {
      return '0 FLOPS';
    }

    const units = ['FLOPS', 'KFLOPS', 'MFLOPS', 'GFLOPS', 'TFLOPS'];
    let unitIndex = 0;
    let displayValue = flops;

    while (displayValue >= 1000 && unitIndex < units.length - 1) {
      displayValue /= 1000;
      unitIndex++;
    }

    const formatted = displayValue < 10
      ? displayValue.toFixed(2)
      : displayValue < 100
        ? displayValue.toFixed(1)
        : displayValue.toFixed(0);

    return `${formatted} ${units[unitIndex]}`;
  } catch {
    return value;
  }
}

/**
 * Format duration from milliseconds to human-readable
 */
export function formatDuration(ms: string): string {
  if (!ms || ms === '0') {
    return '0 ms';
  }

  const value = Number(ms);
  if (!Number.isFinite(value)) {
    return ms;
  }

  if (value < 1000) {
    return `${value.toFixed(0)} ms`;
  }

  return `${(value / 1000).toFixed(2)} s`;
}
