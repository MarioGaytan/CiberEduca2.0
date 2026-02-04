import { NextRequest } from 'next/server';
import { proxyBackend } from '../../../../_lib/backend';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ styleId: string }> }
) {
  const { styleId } = await params;
  const body = await req.text();
  return proxyBackend(req, `/gamification/avatar-configs/${styleId}/unlock`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body,
  });
}
