import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const IS_PROD = process.env.NODE_ENV === 'production';

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
}

function normalizeHeaders(init?: HeadersInit): Record<string, string> {
  if (!init) return {};
  if (init instanceof Headers) {
    const out: Record<string, string> = {};
    init.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  if (Array.isArray(init)) {
    const out: Record<string, string> = {};
    for (const [k, v] of init) out[k] = v;
    return out;
  }
  return init as Record<string, string>;
}

async function fetchBackendWithAccess(path: string, access: string, init?: RequestInit) {
  const base = apiBaseUrl();
  const headers = normalizeHeaders(init?.headers);
  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        ...headers,
        authorization: `Bearer ${access}`,
      },
      cache: 'no-store',
    });

    const data = (await res.json().catch(() => undefined)) as unknown;
    return { ok: true as const, res, data };
  } catch {
    return { ok: false as const };
  }
}

export async function proxyBackend(req: Request, path: string, init?: RequestInit) {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;

  if (!access) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const first = await fetchBackendWithAccess(path, access, init);
  if (!first.ok) {
    return NextResponse.json({ error: 'Backend no disponible.' }, { status: 503 });
  }
  if (first.res.status !== 401) {
    return NextResponse.json(first.data, { status: first.res.status });
  }

  if (!refresh) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
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
    return NextResponse.json({ error: 'Backend no disponible.' }, { status: 503 });
  }
  if (!refreshRes.ok) {
    return NextResponse.json(refreshData, { status: refreshRes.status });
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

  const second = await fetchBackendWithAccess(path, tokens.accessToken, init);
  if (!second.ok) {
    return NextResponse.json({ error: 'Backend no disponible.' }, { status: 503 });
  }
  return NextResponse.json(second.data, { status: second.res.status });
}
