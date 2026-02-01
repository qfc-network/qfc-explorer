import { NextResponse } from 'next/server';
import { getBlockByHeight, getTransactionsByBlockHeight } from '@/db/queries';

function parseNumber(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export async function GET(
  request: Request,
  { params }: { params: { height: string } }
) {
  const { searchParams } = new URL(request.url);
  const page = parseNumber(searchParams.get('page'), 1);
  const limit = clamp(parseNumber(searchParams.get('limit'), 25), 1, 100);
  const offset = (page - 1) * limit;

  const block = await getBlockByHeight(params.height);
  if (!block) {
    return NextResponse.json({ error: 'Block not found' }, { status: 404 });
  }

  const transactions = await getTransactionsByBlockHeight(params.height, limit, offset);

  return NextResponse.json({ block, page, limit, transactions });
}
