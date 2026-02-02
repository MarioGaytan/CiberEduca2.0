import { proxyBackend } from '../../_lib/backend';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  return proxyBackend(req, `/users/teachers?q=${encodeURIComponent(q)}`, { method: 'GET' });
}
