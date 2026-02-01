export function hexToBigIntString(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const normalized = value.startsWith('0x') ? value : `0x${value}`;
  try {
    return BigInt(normalized).toString(10);
  } catch {
    return null;
  }
}

export function hexToNumber(value: string | null | undefined): number | null {
  const parsed = hexToBigIntString(value);
  if (parsed === null) {
    return null;
  }
  const asNumber = Number(parsed);
  return Number.isSafeInteger(asNumber) ? asNumber : null;
}

export function hexToBuffer(value: string | null | undefined): Buffer | null {
  if (!value) {
    return null;
  }
  const normalized = value.startsWith('0x') ? value.slice(2) : value;
  if (normalized.length === 0) {
    return Buffer.alloc(0);
  }
  return Buffer.from(normalized, 'hex');
}

export function stripHexPrefix(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value.startsWith('0x') ? value.slice(2) : value;
}
