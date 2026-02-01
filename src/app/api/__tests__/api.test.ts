import { describe, expect, test } from 'vitest';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const shouldRun = Boolean(baseUrl);

describe('API integration', () => {
  const runTest = shouldRun ? test : test.skip;

  if (!shouldRun) {
    // eslint-disable-next-line no-console
    console.warn('Skipping API integration tests: set NEXT_PUBLIC_BASE_URL to enable.');
  }

  runTest('health endpoint returns ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.ok).toBe(true);
    const payload = await res.json();
    expect(payload.ok).toBe(true);
    expect(payload.data.db).toBeDefined();
  });

  runTest('blocks endpoint returns ok shape', async () => {
    const res = await fetch(`${baseUrl}/api/blocks?limit=1&page=1`);
    expect(res.ok).toBe(true);
    const payload = await res.json();
    expect(payload.ok).toBe(true);
    expect(Array.isArray(payload.data.items)).toBe(true);
  });
});
