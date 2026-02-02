import { NextRequest } from 'next/server';
import { proxyBackend } from '../../_lib/backend';

export async function GET(req: NextRequest) {
  return proxyBackend(req, '/gamification/medals');
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyBackend(req, '/gamification/medals', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
