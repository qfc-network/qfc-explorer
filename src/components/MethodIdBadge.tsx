import { lookupSelector } from '@/lib/decode-input';

type MethodIdBadgeProps = {
  /** The 4-byte method selector, e.g. "0xa9059cbb" or "a9059cbb" */
  selector: string | null | undefined;
};

/**
 * A small badge/pill that shows the decoded function name for a 4-byte method ID.
 * If the selector is known, shows the function name in a colored badge.
 * If unknown, shows the raw hex selector in a gray badge.
 * Returns null for empty/transfer transactions (no input data).
 */
export default function MethodIdBadge({ selector }: MethodIdBadgeProps) {
  if (!selector) return null;

  const clean = selector.startsWith('0x') ? selector : `0x${selector}`;
  const name = lookupSelector(clean);

  if (name) {
    return (
      <span
        className="inline-block max-w-[120px] truncate rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-400"
        title={`${name} (${clean})`}
      >
        {name}
      </span>
    );
  }

  return (
    <span
      className="inline-block rounded bg-slate-700/50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500"
      title={`Unknown method ${clean}`}
    >
      {clean}
    </span>
  );
}
