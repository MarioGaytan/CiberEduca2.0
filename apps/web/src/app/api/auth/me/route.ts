import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const IS_PROD = process.env.NODE_ENV === 'production';

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
}

async function fetchMe(accessToken: string) {
  const res = await fetch(`${apiBaseUrl()}/auth/me`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  const data = (await res.json()) as unknown;
  return { res, data };
}

export async function GET() {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;

  if (!access) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const first = await fetchMe(access);
  if (first.res.ok) {
    return NextResponse.json({ authenticated: true, user: first.data });
  }

  if (!refresh) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const refreshRes = await fetch(`${apiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { authorization: `Bearer ${refresh}` },
  });

  const refreshData = (await refreshRes.json()) as unknown;

  if (!refreshRes.ok) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const tokens = refreshData as { accessToken: string; refreshToken: string };

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

  const second = await fetchMe(tokens.accessToken);
  if (!second.res.ok) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, user: second.data });
}
