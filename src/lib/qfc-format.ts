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
