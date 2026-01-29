import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type RegisterBody = {
  username: string;
  email?: string;
  password: string;
};

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const IS_PROD = process.env.NODE_ENV === 'production';

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
}

export async function POST(req: Request) {
  const body = (await req.json()) as RegisterBody;

  const res = await fetch(`${apiBaseUrl()}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as unknown;

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  const tokens = data as { accessToken: string; refreshToken: string };

  const jar = await cookies();
  jar.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    path: '/',
    maxAge: 60 * 15,
  });
  jar.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
