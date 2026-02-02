import { NextRequest } from 'next/server';
import { proxyBackend } from '../../_lib/backend';

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  return proxyBackend(req, '/progress/avatar', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
