import { NextRequest } from 'next/server';
import { proxyBackend } from '../../_lib/backend';

export async function GET(req: NextRequest) {
  return proxyBackend(req, '/gamification/avatar-options');
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyBackend(req, '/gamification/avatar-options', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
