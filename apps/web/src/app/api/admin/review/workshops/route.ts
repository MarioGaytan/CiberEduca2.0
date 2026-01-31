import { proxyBackend } from '../../../_lib/backend';

export async function GET(req: Request) {
  return proxyBackend(req, '/workshops/in-review', { method: 'GET' });
}
