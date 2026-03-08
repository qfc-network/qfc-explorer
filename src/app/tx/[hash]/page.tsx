import { permanentRedirect } from 'next/navigation';

export default function TxRedirectPage({
  params,
}: {
  params: { hash: string };
}) {
  permanentRedirect(`/txs/${params.hash}`);
}
