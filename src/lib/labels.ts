type LabelMap = Record<string, { label: string; category: string | null }>;

/**
 * Resolve addresses to labels via POST to the backend API (server-side).
 * Returns a map of lowercase address → { label, category }.
 */
export async function resolveAddressLabels(addresses: string[]): Promise<LabelMap> {
  const unique = [...new Set(addresses.filter(Boolean).map((a) => a.toLowerCase()))];
  if (unique.length === 0) return {};

  try {
    const { getApiBaseUrl } = await import('./api-client');
    const base = getApiBaseUrl();
    const isExternal = base.includes(':3001') ||
      (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || '').length > 0;
    const url = isExternal ? `${base}/search/labels` : `${base}/api/search/labels`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresses: unique }),
      next: { revalidate: 60 },
    } as RequestInit);

    if (!res.ok) return {};
    const json = await res.json() as { ok: boolean; data: LabelMap };
    return json.ok ? json.data : {};
  } catch {
    return {};
  }
}
