import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const IS_PROD = process.env.NODE_ENV === 'production';

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
}

export async function POST() {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;

  if (access) {
    await fetch(`${apiBaseUrl()}/auth/logout`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${access}`,
      },
    }).catch(() => undefined);
  }

  jar.set(ACCESS_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    path: '/',
    maxAge: 0,
  });
  jar.set(REFRESH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    path: '/',
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
