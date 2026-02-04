import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const IS_PROD = process.env.NODE_ENV === 'production';

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
}

async function fetchMe(accessToken: string) {
  try {
    const res = await fetch(`${apiBaseUrl()}/auth/me`, {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });

    const data = (await res.json().catch(() => undefined)) as unknown;
    return { ok: true as const, res, data };
  } catch {
    return { ok: false as const };
  }
}

export async function GET() {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;

  if (access) {
    const first = await fetchMe(access);
    if (!first.ok) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    if (first.res.ok) {
      return NextResponse.json({ authenticated: true, user: first.data });
    }
  }

  if (!refresh) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  let refreshRes: Response;
  let refreshData: unknown;
  try {
    refreshRes = await fetch(`${apiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { authorization: `Bearer ${refresh}` },
    });
    refreshData = (await refreshRes.json().catch(() => undefined)) as unknown;
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  if (!refreshRes.ok) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const tokens = refreshData as { accessToken: string; refreshToken: string };

  jar.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  jar.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  const second = await fetchMe(tokens.accessToken);
  if (!second.ok || !second.res.ok) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, user: second.data });
}
