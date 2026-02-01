import { getReceiptLogsByTxHash, getTransactionByHash } from '@/db/queries';
import { fail, ok } from '@/lib/api-response';

export async function GET(
  _request: Request,
  { params }: { params: { hash: string } }
) {
  const tx = await getTransactionByHash(params.hash);
  if (!tx) {
    return fail('Transaction not found', 404);
  }

  const logs = await getReceiptLogsByTxHash(params.hash);

  return ok({ transaction: tx, logs });
}
