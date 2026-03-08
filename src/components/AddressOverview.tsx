'use client';

import { useTranslation } from '@/components/LocaleProvider';
import type { TranslationKey } from '@/lib/translations/en';

type CardDef = {
  labelKey: TranslationKey;
  value: string;
  sub?: string;
};

export default function AddressOverview({ cards }: { cards: CardDef[] }) {
  const { t } = useTranslation();

  return (
    <>
      {cards.map((card) => (
        <div key={card.labelKey} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">{t(card.labelKey)}</p>
          <p className="mt-1.5 text-sm font-medium text-white">{card.value}</p>
          {card.sub && <p className="mt-0.5 text-xs text-slate-400">{card.sub}</p>}
        </div>
      ))}
    </>
  );
}
