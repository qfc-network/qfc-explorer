export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getStatsOverview } from '@/db/queries';

export async function GET() {
  const intervalMs = Math.max(3000, Number(process.env.SSE_INTERVAL_MS ?? 5000));

  let active = true;
  let interval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = async () => {
        if (!active) return;
        try {
          const stats = await getStatsOverview();
          if (!active) return; // check again after async work
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(stats)}\n\n`));
        } catch {
          // DB error — skip this tick, don't crash the stream
        }
      };

      interval = setInterval(send, intervalMs);
      await send();

      if (active) {
        controller.enqueue(encoder.encode('event: ready\n\n'));
      }
    },
    cancel() {
      active = false;
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
