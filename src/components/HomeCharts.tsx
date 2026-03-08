'use client';

import { useTranslation } from '@/components/LocaleProvider';
import StatChart from '@/components/StatChart';

type ChartPoint = { label: string; value: number; timestamp?: number };

type Props = {
  series: {
    block_time_ms: ChartPoint[];
    tps: ChartPoint[];
    active_addresses: ChartPoint[];
  };
};

export default function HomeCharts({ series }: Props) {
  const { t } = useTranslation();

  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-3">
      <StatChart title={t('chart.blockTime')} points={series.block_time_ms} suffix=" ms" />
      <StatChart title={t('chart.txsPerBlock')} points={series.tps} />
      <StatChart title={t('chart.activeAddresses')} points={series.active_addresses} />
    </section>
  );
}
