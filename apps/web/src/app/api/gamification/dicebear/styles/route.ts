import { NextRequest } from 'next/server';
import { proxyBackend } from '../../../_lib/backend';

export async function GET(req: NextRequest) {
  return proxyBackend(req, '/gamification/dicebear/styles');
}
