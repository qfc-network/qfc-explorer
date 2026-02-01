import { describe, expect, test } from 'vitest';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

describe('API integration', () => {
  test('health endpoint returns ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.ok).toBe(true);
    const payload = await res.json();
    expect(payload.ok).toBe(true);
    expect(payload.data.db).toBeDefined();
  });

  test('blocks endpoint returns ok shape', async () => {
    const res = await fetch(`${baseUrl}/api/blocks?limit=1&page=1`);
    expect(res.ok).toBe(true);
    const payload = await res.json();
    expect(payload.ok).toBe(true);
    expect(Array.isArray(payload.data.items)).toBe(true);
  });
});
