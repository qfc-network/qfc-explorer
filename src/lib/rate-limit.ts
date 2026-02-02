// Simple in-memory rate limiter
// In production, use Redis for distributed rate limiting

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitStats = {
  ip: string;
  requests: number;
  limited: boolean;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();
const requestHistory: Array<{ ip: string; path: string; timestamp: number; limited: boolean }> = [];

// Configuration
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 100; // 100 requests per minute per IP
const HISTORY_SIZE = 1000; // Keep last 1000 requests

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    cleanupExpired();
  }

  if (!entry || entry.resetAt < now) {
    // New window
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetAt: now + WINDOW_MS,
    };
  }

  if (entry.count >= MAX_REQUESTS) {
    // Rate limited
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count += 1;
  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.count,
    resetAt: entry.resetAt,
  };
}

export function recordRequest(ip: string, path: string, limited: boolean): void {
  requestHistory.push({
    ip,
    path,
    timestamp: Date.now(),
    limited,
  });

  // Trim history if needed
  if (requestHistory.length > HISTORY_SIZE) {
    requestHistory.splice(0, requestHistory.length - HISTORY_SIZE);
  }
}

export function getRateLimitStats(): {
  activeIps: number;
  totalRequests: number;
  limitedRequests: number;
  topIps: RateLimitStats[];
  recentRequests: Array<{ ip: string; path: string; timestamp: number; limited: boolean }>;
} {
  const now = Date.now();
  const oneMinuteAgo = now - WINDOW_MS;

  // Get active entries
  const activeEntries: RateLimitStats[] = [];
  rateLimitStore.forEach((entry, ip) => {
    if (entry.resetAt > now) {
      activeEntries.push({
        ip: maskIp(ip),
        requests: entry.count,
        limited: entry.count >= MAX_REQUESTS,
        resetAt: entry.resetAt,
      });
    }
  });

  // Sort by request count
  activeEntries.sort((a, b) => b.requests - a.requests);

  // Calculate stats from history
  const recentHistory = requestHistory.filter((r) => r.timestamp > oneMinuteAgo);
  const limitedCount = recentHistory.filter((r) => r.limited).length;

  return {
    activeIps: activeEntries.length,
    totalRequests: recentHistory.length,
    limitedRequests: limitedCount,
    topIps: activeEntries.slice(0, 10),
    recentRequests: requestHistory.slice(-50).reverse().map((r) => ({
      ...r,
      ip: maskIp(r.ip),
    })),
  };
}

export function getConfig(): { windowMs: number; maxRequests: number } {
  return {
    windowMs: WINDOW_MS,
    maxRequests: MAX_REQUESTS,
  };
}

function cleanupExpired(): void {
  const now = Date.now();
  rateLimitStore.forEach((entry, ip) => {
    if (entry.resetAt < now) {
      rateLimitStore.delete(ip);
    }
  });
}

function maskIp(ip: string): string {
  // Mask the last octet for privacy
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.*`;
  }
  // IPv6 or other format - just show first part
  return ip.substring(0, 12) + '...';
}
