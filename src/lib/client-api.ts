/**
 * Client-side API URL resolver.
 * Used by client components that call fetch() directly.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Resolve an API path for client-side fetch.
 * If NEXT_PUBLIC_API_URL is set, strips /api prefix and prepends the base.
 * Otherwise returns the path as-is (same-origin Next.js API routes).
 */
export function apiUrl(path: string): string {
  if (!API_BASE) return path;

  if (path.startsWith('/api/')) {
    return `${API_BASE}${path.slice(4)}`;
  }
  if (path.startsWith('/api')) {
    return `${API_BASE}${path.slice(4) || '/'}`;
  }
  return `${API_BASE}${path}`;
}
