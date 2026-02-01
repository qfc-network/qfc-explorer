import { NextResponse } from 'next/server';
import { getStatsOverview } from '@/db/queries';

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let active = true;

      const send = async () => {
        if (!active) return;
        const stats = await getStatsOverview();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(stats)}\n\n`));
      };

      const interval = setInterval(send, 3000);
      await send();

      controller.enqueue(encoder.encode('event: ready\n\n'));

      return () => {
        active = false;
        clearInterval(interval);
      };
    },
    cancel() {
      // noop
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
