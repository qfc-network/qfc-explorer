import { describe, it, expect } from 'vitest';
import { shortenHash, formatNumber, formatWeiToQfc, formatTimestampMs } from '@/lib/format';

describe('shortenHash', () => {
  it('returns empty string for empty input', () => {
    expect(shortenHash('')).toBe('');
  });

  it('returns full hash if short enough', () => {
    expect(shortenHash('0x1234abcd')).toBe('0x1234abcd');
  });

  it('shortens a full 42-char address', () => {
    const addr = '0x1234567890abcdef1234567890abcdef12345678';
    const result = shortenHash(addr);
    expect(result).toBe('0x123456\u20265678');
  });

  it('uses custom head/tail lengths', () => {
    const addr = '0x1234567890abcdef1234567890abcdef12345678';
    const result = shortenHash(addr, 4, 6);
    expect(result).toBe('0x1234\u2026345678');
  });

  it('returns full value when length equals head+tail+2', () => {
    // head=6, tail=4, so 12 chars exactly should not be shortened
    expect(shortenHash('0x12345678ab')).toBe('0x12345678ab');
  });

  it('shortens a 66-char tx hash', () => {
    const hash = '0x' + 'a'.repeat(64);
    const result = shortenHash(hash);
    expect(result.startsWith('0x')).toBe(true);
    expect(result).toContain('…');
    expect(result.endsWith('aaaa')).toBe(true);
  });
});

describe('formatNumber', () => {
  it('formats a large number with commas', () => {
    expect(formatNumber(1000000)).toBe('1,000,000');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('formats negative numbers', () => {
    expect(formatNumber(-12345)).toBe('-12,345');
  });

  it('handles string input', () => {
    expect(formatNumber('999999')).toBe('999,999');
  });

  it('returns original string for non-finite values', () => {
    expect(formatNumber('not-a-number')).toBe('not-a-number');
  });

  it('formats small numbers without commas', () => {
    expect(formatNumber(42)).toBe('42');
  });

  it('handles decimal numbers', () => {
    const result = formatNumber(1234.56);
    expect(result).toContain('1,234');
  });
});

describe('formatWeiToQfc', () => {
  it('returns 0 for empty string', () => {
    expect(formatWeiToQfc('')).toBe('0');
  });

  it('converts 1 ether in wei', () => {
    const oneEther = '1000000000000000000';
    expect(formatWeiToQfc(oneEther)).toBe('1');
  });

  it('converts 1.5 ether in wei', () => {
    const val = '1500000000000000000';
    const result = formatWeiToQfc(val);
    expect(result).toBe('1.5000');
  });

  it('converts hex value with 0x prefix', () => {
    // 0xde0b6b3a7640000 = 10^18 = 1 ether
    expect(formatWeiToQfc('0xde0b6b3a7640000')).toBe('1');
  });

  it('converts hex value without 0x prefix containing a-f chars', () => {
    expect(formatWeiToQfc('de0b6b3a7640000')).toBe('1');
  });

  it('handles large values with commas', () => {
    const thousandEther = '1000000000000000000000';
    expect(formatWeiToQfc(thousandEther)).toBe('1,000');
  });

  it('returns the value itself for invalid input', () => {
    expect(formatWeiToQfc('not-valid!')).toBe('not-valid!');
  });
});

describe('formatTimestampMs', () => {
  it('formats a timestamp in milliseconds', () => {
    // 2024-01-15T12:00:00.000Z
    const ts = '1705320000000';
    const result = formatTimestampMs(ts);
    // Should be a localized date string
    expect(result).toBeTruthy();
    expect(result).not.toBe(ts);
  });

  it('returns original value for non-numeric input', () => {
    expect(formatTimestampMs('not-a-number')).toBe('not-a-number');
  });

  it('formats epoch zero', () => {
    const result = formatTimestampMs('0');
    expect(result).toBeTruthy();
  });
});
