export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getRateLimitStats, getConfig } from '@/lib/rate-limit';
import { ok } from '@/lib/api-response';

export async function GET() {
  const stats = getRateLimitStats();
  const config = getConfig();

  return ok({
    config: {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      windowSeconds: config.windowMs / 1000,
    },
    stats: {
      activeIps: stats.activeIps,
      totalRequests: stats.totalRequests,
      limitedRequests: stats.limitedRequests,
      limitedPercentage: stats.totalRequests > 0
        ? ((stats.limitedRequests / stats.totalRequests) * 100).toFixed(2)
        : '0.00',
    },
    topIps: stats.topIps,
    recentRequests: stats.recentRequests,
  });
}
