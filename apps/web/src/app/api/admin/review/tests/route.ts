import { proxyBackend } from '../../../_lib/backend';

export async function GET(req: Request) {
  return proxyBackend(req, '/tests/in-review', { method: 'GET' });
}
