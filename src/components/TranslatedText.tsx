'use client';

import { useTranslation } from '@/components/LocaleProvider';
import type { TranslationKey } from '@/lib/translations/en';

/**
 * Simple client component that renders a translated string.
 * Use in server components where you need inline translation.
 */
export default function TranslatedText({
  tKey,
  as: Tag = 'span',
  className,
}: {
  tKey: TranslationKey;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div';
  className?: string;
}) {
  const { t } = useTranslation();
  return <Tag className={className}>{t(tKey)}</Tag>;
}
