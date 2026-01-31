import { proxyBackend } from '../../_lib/backend';

export async function GET(req: Request) {
  return proxyBackend(req, '/users', { method: 'GET' });
}

export async function POST(req: Request) {
  const body = (await req.json()) as unknown;
  return proxyBackend(req, '/users', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
