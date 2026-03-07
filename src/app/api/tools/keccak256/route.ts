export const dynamic = "force-dynamic";

import { NextRequest } from 'next/server';
import { keccak256 } from 'js-sha3';
import { ok, err } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get('input');
  if (!input) {
    return err('Missing input parameter', 400);
  }

  const hash = '0x' + keccak256(input);
  return ok({ input, hash });
}
