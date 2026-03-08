'use client';

import Link from 'next/link';
import { useTranslation } from '@/components/LocaleProvider';

type Props = {
  basePath: string;
  page: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextHref?: string;
  prevHref?: string;
  cursor?: string | null;
};

export default function TranslatedPagination({
  basePath,
  page,
  hasNext,
  hasPrevious,
  nextHref,
  prevHref,
  cursor,
}: Props) {
  const { t } = useTranslation();

  const prevLink = prevHref ?? (cursor ? basePath : `${basePath}?page=${page - 1}`);
  const nextLink = nextHref ?? `${basePath}?page=${page + 1}`;
  const centerText = cursor ? t('common.cursorPagination') : `${t('common.page')} ${page}`;

  return (
    <div className="flex items-center justify-between text-sm text-slate-400">
      {hasPrevious ? (
        <Link
          href={prevLink}
          className="rounded-full border border-slate-800 px-4 py-2 hover:bg-slate-900 transition-colors"
        >
          {t('common.previous')}
        </Link>
      ) : (
        <span className="rounded-full border border-slate-800/40 px-4 py-2 text-slate-600">
          {t('common.previous')}
        </span>
      )}
      <span>{centerText}</span>
      {hasNext ? (
        <Link
          href={nextLink}
          className="rounded-full border border-slate-800 px-4 py-2 hover:bg-slate-900 transition-colors"
        >
          {t('common.next')}
        </Link>
      ) : (
        <span className="rounded-full border border-slate-800/40 px-4 py-2 text-slate-600">
          {t('common.next')}
        </span>
      )}
    </div>
  );
}
