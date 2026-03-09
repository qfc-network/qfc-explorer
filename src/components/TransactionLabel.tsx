'use client';

type DefiLabel = {
  action: string;
  category: string;
  protocolName?: string;
  icon?: string;
};

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  dex:        { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  lending:    { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20' },
  staking:    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  nft:        { bg: 'bg-pink-500/10',   text: 'text-pink-400',   border: 'border-pink-500/20' },
  governance: { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/20' },
  token:      { bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   border: 'border-cyan-500/20' },
  bridge:     { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  other:      { bg: 'bg-slate-500/10',  text: 'text-slate-400',  border: 'border-slate-500/20' },
};

const CATEGORY_ICONS: Record<string, string> = {
  dex: '\u{1F504}',
  lending: '\u{1F3E6}',
  staking: '\u{26A1}',
  nft: '\u{1F3A8}',
  governance: '\u{1F5F3}',
  token: '\u{1F4B0}',
  bridge: '\u{1F309}',
  other: '\u{2699}',
};

export default function TransactionLabel({ label }: { label: DefiLabel }) {
  const style = CATEGORY_STYLES[label.category] ?? CATEGORY_STYLES.other;
  const icon = label.icon || CATEGORY_ICONS[label.category] || CATEGORY_ICONS.other;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text} ${style.border}`}
    >
      <span className="text-[11px]">{icon}</span>
      <span>{label.action}</span>
      {label.protocolName && (
        <span className="opacity-60">({label.protocolName})</span>
      )}
    </span>
  );
}
