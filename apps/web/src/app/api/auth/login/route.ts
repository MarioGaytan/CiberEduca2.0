import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type LoginBody = {
  identifier: string;
  password: string;
};

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const IS_PROD = process.env.NODE_ENV === 'production';

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
}

export async function POST(req: Request) {
  const body = (await req.json()) as LoginBody;

  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con el servidor.' }, { status: 502 });
  }

  const data = (await res.json().catch(() => undefined)) as unknown;

  if (!res.ok) {
    return NextResponse.json(data ?? { error: 'No se pudo iniciar sesión.' }, { status: res.status });
  }

  const tokens = data as { accessToken: string; refreshToken: string };

  const jar = await cookies();
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

  return NextResponse.json({ ok: true });
}
