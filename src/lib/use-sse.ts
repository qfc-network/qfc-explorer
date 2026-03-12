'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/api-client';

type SSEState = {
  /** Latest data keyed by event type. Default "message" events use key "message". */
  data: Record<string, unknown>;
  connected: boolean;
};

/**
 * Hook that connects to the backend SSE `/stream` endpoint.
 *
 * @param eventTypes - Event types to listen for. Use "message" for unnamed data-only events.
 *                     The "ready" event is always handled internally for connection status.
 * @returns `{ data, connected }` — data is keyed by event type, connected reflects SSE status.
 */
export function useSSE(eventTypes: string[] = ['message']): SSEState {
  const [data, setData] = useState<Record<string, unknown>>({});
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    // Only connect when page is visible
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }

    // Build SSE URL
    const base = getApiBaseUrl();
    const isExternalApi =
      base.includes(':3001') ||
      (process.env.NEXT_PUBLIC_API_URL ?? '').length > 0;
    const streamPath = isExternalApi ? '/stream' : '/api/stream';
    const url = `${base}${streamPath}`;

    const es = new EventSource(url);
    esRef.current = es;

    // Handle the "ready" event emitted by the backend on connection
    es.addEventListener('ready', () => {
      setConnected(true);
      retryRef.current = 0; // reset backoff on successful connection
    });

    // Listen for each requested event type
    for (const type of eventTypes) {
      if (type === 'message') {
        // Default unnamed events use the `onmessage` handler
        es.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            setData((prev) => ({ ...prev, message: parsed }));
          } catch {
            // ignore malformed data
          }
        };
      } else {
        es.addEventListener(type, ((event: MessageEvent) => {
          try {
            const parsed = JSON.parse(event.data);
            setData((prev) => ({ ...prev, [type]: parsed }));
          } catch {
            // ignore
          }
        }) as EventListener);
      }
    }

    es.onerror = () => {
      setConnected(false);
      es.close();
      esRef.current = null;

      // Give up after 3 retries (endpoint likely doesn't exist)
      if (retryRef.current >= 3) return;

      // Exponential backoff: 2s, 4s, 8s
      const delay = Math.min(2000 * Math.pow(2, retryRef.current), 30000);
      retryRef.current += 1;
      timerRef.current = setTimeout(connect, delay);
    };
  }, [eventTypes]);

  useEffect(() => {
    connect();

    // Pause/resume based on page visibility
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Reconnect if not already connected
        if (!esRef.current || esRef.current.readyState === EventSource.CLOSED) {
          connect();
        }
      } else {
        // Disconnect when hidden to save resources
        if (esRef.current) {
          esRef.current.close();
          esRef.current = null;
        }
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setConnected(false);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [connect]);

  return { data, connected };
}
