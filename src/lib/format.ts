export function shortenHash(value: string, head = 6, tail = 4): string {
  if (!value) {
    return '';
  }
  if (value.length <= head + tail + 2) {
    return value;
  }
  return `${value.slice(0, head + 2)}…${value.slice(-tail)}`;
}

export function formatNumber(value: string | number): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(num)) {
    return String(value);
  }
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatTimestampMs(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return value;
  }
  const date = new Date(num);
  return date.toLocaleString('en-US', { hour12: false });
}
