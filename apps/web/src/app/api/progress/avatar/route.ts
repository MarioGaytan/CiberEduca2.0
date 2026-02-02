import { NextRequest, NextResponse } from 'next/server';
import { proxyBackend } from '../../_lib/backend';

export async function PATCH(req: NextRequest) {
  return proxyBackend(req, '/progress/avatar', { method: 'PATCH' });
}
