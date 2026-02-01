import { NextResponse } from 'next/server';
import { getReceiptLogsByTxHash, getTransactionByHash } from '@/db/queries';

export async function GET(
  _request: Request,
  { params }: { params: { hash: string } }
) {
  const tx = await getTransactionByHash(params.hash);
  if (!tx) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  const logs = await getReceiptLogsByTxHash(params.hash);

  return NextResponse.json({ transaction: tx, logs });
}
