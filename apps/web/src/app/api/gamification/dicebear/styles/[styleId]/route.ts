import { NextRequest } from 'next/server';
import { proxyBackend } from '../../../../_lib/backend';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ styleId: string }> }
) {
  const { styleId } = await params;
  return proxyBackend(req, `/gamification/dicebear/styles/${styleId}`);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ styleId: string }> }
) {
  const { styleId } = await params;
  const body = await req.text();
  return proxyBackend(req, `/gamification/dicebear/styles/${styleId}`, { 
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body,
  });
}
