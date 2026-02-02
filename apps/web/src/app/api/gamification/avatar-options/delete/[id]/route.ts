import { NextRequest } from 'next/server';
import { proxyBackend } from '../../../../_lib/backend';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyBackend(req, `/gamification/avatar-options/${id}`, { method: 'DELETE' });
}
