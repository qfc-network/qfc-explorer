'use client';

import { useTranslation } from '@/components/LocaleProvider';
import SearchBar from '@/components/SearchBar';

export default function HomeHero() {
  const { t } = useTranslation();

  return (
    <section className="py-10 md:py-14">
      <h1 className="text-2xl font-semibold text-white sm:text-3xl">
        {t('home.title')}
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        {t('home.subtitle')}
      </p>
      <div className="mt-5 max-w-2xl">
        <SearchBar prominent />
      </div>
    </section>
  );
}
