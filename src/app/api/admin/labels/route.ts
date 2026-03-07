export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api-client';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/admin/labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
