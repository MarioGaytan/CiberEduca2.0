import { NextRequest } from 'next/server';
import { proxyBackend } from '../../../_lib/backend';

export async function PUT(req: NextRequest) {
  const body = await req.json();
  return proxyBackend(req, '/gamification/config/level', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
