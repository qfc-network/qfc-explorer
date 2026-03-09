'use client';

import { useEffect, useRef, useState } from 'react';
import { useSSE } from '@/lib/use-sse';
import { useTranslation } from '@/components/LocaleProvider';
import LiveIndicator from '@/components/LiveIndicator';

type Props = {
  /** The highest block height from the SSR data */
  initialHeight: string;
};

/**
 * Banner that appears on the blocks list page when new blocks arrive via SSE.
 * Shows "X new blocks" and reloads the page when clicked.
 */
export default function BlocksLiveBanner({ initialHeight }: Props) {
  const { data: sseData, connected } = useSSE(['message']);
  const { t } = useTranslation();
  const [newCount, setNewCount] = useState(0);
  const baseHeight = useRef(BigInt(initialHeight || '0'));

  useEffect(() => {
    const msg = sseData.message as Record<string, string | null> | undefined;
    if (!msg?.latest_block) return;

    const latest = BigInt(msg.latest_block);
    if (latest > baseHeight.current) {
      setNewCount(Number(latest - baseHeight.current));
    }
  }, [sseData.message]);

  const handleClick = () => {
    // Reload to get fresh server-rendered data
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-between">
      <LiveIndicator connected={connected} />
      {newCount > 0 && (
        <button
          onClick={handleClick}
          className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
        >
          {t('live.newBlocks').replace('{count}', String(newCount))}
        </button>
      )}
    </div>
  );
}
