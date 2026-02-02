import { NextRequest } from 'next/server';
import { proxyBackend } from '../../../../../../_lib/backend';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ xp: string; level: string }> }
) {
  const { xp, level } = await params;
  return proxyBackend(req, `/gamification/dicebear/styles/user/${xp}/${level}`);
}
