import { NextResponse } from 'next/server';

export type ApiOk<T> = {
  ok: true;
  data: T;
};

export type ApiError = {
  ok: false;
  error: string;
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data } satisfies ApiOk<T>, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message } satisfies ApiError, { status });
}

// Alias for backward compatibility
export const err = fail;
