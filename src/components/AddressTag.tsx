import Link from 'next/link';
import { shortenHash } from '@/lib/format';

type Props = {
  address: string;
  label?: string | null;
  shorten?: boolean;
};

export default function AddressTag({ address, label, shorten = true }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Link href={`/address/${address}`} className="text-slate-800 dark:text-slate-200 hover:text-cyan-400">
        {shorten ? shortenHash(address) : address}
      </Link>
      {label && (
        <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-400 whitespace-nowrap">
          {label}
        </span>
      )}
    </span>
  );
}
