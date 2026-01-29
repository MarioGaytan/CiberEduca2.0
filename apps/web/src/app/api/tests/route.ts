import { proxyBackend } from '../_lib/backend';

export async function POST(req: Request) {
  const body = (await req.json()) as unknown;
  return proxyBackend(req, '/tests', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
