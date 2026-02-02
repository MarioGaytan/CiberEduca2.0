import { NextRequest, NextResponse } from 'next/server';
import { proxyBackend } from '../../_lib/backend';

export async function GET(req: NextRequest) {
  return proxyBackend(req, '/progress/medals');
}
