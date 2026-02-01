type FetchOptions = {
  cache?: RequestCache;
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

export function getBaseUrl(): string {
  const publicBase = process.env.NEXT_PUBLIC_BASE_URL;
  if (publicBase) {
    return publicBase.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

export async function fetchJson<T>(path: string, options?: FetchOptions): Promise<T> {
  const baseUrl = getBaseUrl();
  const init: RequestInit & { next?: FetchOptions['next'] } = {};
  if (options?.next) {
    init.next = options.next;
  } else {
    init.cache = options?.cache ?? 'no-store';
  }

  const response = await fetch(`${baseUrl}${path}`, init);

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
