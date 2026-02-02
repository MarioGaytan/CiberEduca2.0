import { NextRequest, NextResponse } from 'next/server';
import { proxyBackend } from '../../_lib/backend';

export async function GET(req: NextRequest) {
  const limit = req.nextUrl.searchParams.get('limit') || '50';
  return proxyBackend(req, `/progress/ranking?limit=${limit}`);
}
