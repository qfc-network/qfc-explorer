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

export function parseAddressFromTopic(topic: string): string | null {
  if (!topic) {
    return null;
  }
  const hex = topic.startsWith('0x') ? topic.slice(2) : topic;
  if (hex.length < 40) {
    return null;
  }
  return `0x${hex.slice(-40)}`.toLowerCase();
}

export function decodeUint256(hexValue: string): string | null {
  const stripped = stripHexPrefix(hexValue);
  if (!stripped) {
    return null;
  }
  try {
    return BigInt(`0x${stripped}`).toString(10);
  } catch {
    return null;
  }
}

export function decodeString(hexValue: string): string | null {
  const stripped = stripHexPrefix(hexValue);
  if (!stripped || stripped.length < 64) {
    return null;
  }
  try {
    const offset = Number(BigInt(`0x${stripped.slice(0, 64)}`));
    const lenStart = offset * 2;
    const lenHex = stripped.slice(lenStart, lenStart + 64);
    const length = Number(BigInt(`0x${lenHex}`));
    const dataStart = lenStart + 64;
    const dataHex = stripped.slice(dataStart, dataStart + length * 2);
    const buf = Buffer.from(dataHex, 'hex');
    return buf.toString('utf8');
  } catch {
    return null;
  }
}
