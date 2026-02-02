import { NextRequest } from 'next/server';
import { proxyBackend } from '../../../../../../../_lib/backend';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ styleId: string; xp: string; level: string }> }
) {
  const { styleId, xp, level } = await params;
  return proxyBackend(req, `/gamification/dicebear/styles/${styleId}/user/${xp}/${level}`);
}
