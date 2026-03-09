type FetchOptions = {
  cache?: RequestCache;
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

/**
 * Get the API base URL.
 *
 * Server-side (SSR): uses API_URL env var to call the Fastify backend directly
 * (e.g. http://api:3001). Falls back to NEXT_PUBLIC_API_URL, then local /api routes.
 *
 * Client-side (browser): uses NEXT_PUBLIC_API_URL if set, otherwise falls back
 * to the same origin (relative /api paths → Next.js API routes as proxy).
 */
export function getApiBaseUrl(): string {
  // Server-side: prefer internal API_URL (not exposed to browser)
  if (typeof window === 'undefined') {
    const internal = process.env.API_URL;
    if (internal) return internal.replace(/\/$/, '');
  }

  // Both server & client: public API URL
  const publicApi = process.env.NEXT_PUBLIC_API_URL;
  if (publicApi) return publicApi.replace(/\/$/, '');

  // Fallback: same-origin (Next.js API routes or local dev)
  if (typeof window === 'undefined') {
    const base = process.env.NEXT_PUBLIC_BASE_URL;
    if (base) return base.replace(/\/$/, '');
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return 'http://localhost:3000';
  }

  return '';
}

// Keep old name for backward compatibility
export const getBaseUrl = getApiBaseUrl;

/**
 * Map a path like "/api/blocks" to the correct API URL.
 * If the external API is configured, strips the "/api" prefix since
 * qfc-explorer-api routes don't have it (e.g. /api/blocks → /blocks).
 */
function resolveApiPath(path: string): string {
  const base = getApiBaseUrl();
  const isExternalApi = base.includes(':3001') ||
    (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || '').length > 0;

  if (isExternalApi && path.startsWith('/api/')) {
    return `${base}${path.slice(4)}`; // /api/blocks → /blocks
  }
  if (isExternalApi && path.startsWith('/api')) {
    return `${base}${path.slice(4) || '/'}`;
  }

  return `${base}${path}`;
}

export async function fetchJson<T>(path: string, options?: FetchOptions): Promise<T> {
  const url = resolveApiPath(path);
  const init: RequestInit & { next?: FetchOptions['next'] } = {};
  if (options?.next) {
    init.next = options.next;
  } else {
    init.cache = options?.cache ?? 'no-store';
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchJsonSafe<T>(
  path: string,
  options?: FetchOptions
): Promise<T | null> {
  try {
    return await fetchJson<T>(path, options);
  } catch (error) {
    console.error(`Failed to fetch ${path}`, error);
    return null;
  }
}
