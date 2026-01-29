import { proxyBackend } from '../../../_lib/backend';

export async function GET(req: Request) {
  return proxyBackend(req, '/tests/inbox/attempts', { method: 'GET' });
}
