import { describe, it, expect } from 'vitest';
import { formatQfcAmount, formatHashrate, formatPercentage, formatFlops, formatDuration } from '@/lib/qfc-format';

describe('formatQfcAmount', () => {
  it('returns "0" for empty string', () => {
    expect(formatQfcAmount('')).toBe('0');
  });

  it('converts hex wei string with 0x prefix to 1 QFC', () => {
    // 0xde0b6b3a7640000 = 10^18 wei = 1 QFC
    expect(formatQfcAmount('0xde0b6b3a7640000')).toBe('1');
  });

  it('converts hex string without 0x prefix', () => {
    // de0b6b3a7640000 = 10^18 wei = 1 QFC
    expect(formatQfcAmount('de0b6b3a7640000')).toBe('1');
  });

  it('shows fractional QFC with 4 decimal places', () => {
    // 0x14d1120d7b160000 = 1.5 * 10^18
    expect(formatQfcAmount('0x14d1120d7b160000')).toBe('1.5000');
  });

  it('formats large amounts with commas', () => {
    // 0xd3c21bcecceda1000000 = 10^24 = 1,000,000 QFC
    expect(formatQfcAmount('0xd3c21bcecceda1000000')).toBe('1,000,000');
  });

  it('handles pure digit string (treated as hex)', () => {
    // Pure digit strings match hex regex, so '100' = 0x100 = 256 wei
    const result = formatQfcAmount('100');
    // 256 wei is tiny, should show 0.0000
    expect(result).toBe('0.0000');
  });

  it('returns original value for non-numeric input', () => {
    expect(formatQfcAmount('hello')).toBe('hello');
  });
});

describe('formatHashrate', () => {
  it('returns "0 H/s" for empty string', () => {
    expect(formatHashrate('')).toBe('0 H/s');
  });

  it('returns "0 H/s" for zero', () => {
    expect(formatHashrate('0')).toBe('0 H/s');
  });

  it('formats small hashrate in H/s', () => {
    expect(formatHashrate('500')).toBe('500 H/s');
  });

  it('formats KH/s range', () => {
    const result = formatHashrate('1500');
    expect(result).toBe('1.50 KH/s');
  });

  it('formats MH/s range', () => {
    const result = formatHashrate('2500000');
    expect(result).toBe('2.50 MH/s');
  });

  it('formats GH/s range', () => {
    const result = formatHashrate('3000000000');
    expect(result).toBe('3.00 GH/s');
  });

  it('formats TH/s range', () => {
    const result = formatHashrate('1500000000000');
    expect(result).toBe('1.50 TH/s');
  });

  it('uses fewer decimals for larger display values', () => {
    // 50,000 H/s -> 50.0 KH/s
    const result = formatHashrate('50000');
    expect(result).toBe('50.0 KH/s');
  });

  it('uses no decimals for 100+ display values', () => {
    // 500,000 H/s -> 500 KH/s
    const result = formatHashrate('500000');
    expect(result).toBe('500 KH/s');
  });

  it('returns original value on error', () => {
    expect(formatHashrate('not-a-number')).toBe('not-a-number');
  });
});

describe('formatPercentage', () => {
  it('returns "0%" for empty string', () => {
    expect(formatPercentage('')).toBe('0%');
  });

  it('formats a percentage with 2 decimal places', () => {
    expect(formatPercentage('50')).toBe('50.00%');
  });

  it('formats zero', () => {
    expect(formatPercentage('0')).toBe('0.00%');
  });

  it('formats decimal percentages', () => {
    expect(formatPercentage('99.5')).toBe('99.50%');
  });

  it('formats small percentages', () => {
    expect(formatPercentage('0.123')).toBe('0.12%');
  });

  it('returns original value for non-numeric input', () => {
    expect(formatPercentage('abc')).toBe('abc');
  });
});

describe('formatFlops', () => {
  it('returns "0 FLOPS" for empty string', () => {
    expect(formatFlops('')).toBe('0 FLOPS');
  });

  it('returns "0 FLOPS" for zero', () => {
    expect(formatFlops('0')).toBe('0 FLOPS');
  });

  it('formats KFLOPS range', () => {
    expect(formatFlops('1500')).toBe('1.50 KFLOPS');
  });

  it('formats GFLOPS range', () => {
    expect(formatFlops('5000000000')).toBe('5.00 GFLOPS');
  });

  it('formats TFLOPS range', () => {
    expect(formatFlops('2000000000000')).toBe('2.00 TFLOPS');
  });
});

describe('formatDuration', () => {
  it('returns "0 ms" for empty string', () => {
    expect(formatDuration('')).toBe('0 ms');
  });

  it('returns "0 ms" for zero', () => {
    expect(formatDuration('0')).toBe('0 ms');
  });

  it('formats milliseconds', () => {
    expect(formatDuration('500')).toBe('500 ms');
  });

  it('formats seconds', () => {
    expect(formatDuration('2500')).toBe('2.50 s');
  });

  it('returns original value for non-numeric input', () => {
    expect(formatDuration('abc')).toBe('abc');
  });
});
