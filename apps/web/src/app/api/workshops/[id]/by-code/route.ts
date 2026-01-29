import { proxyBackend } from '../../../_lib/backend';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const q = code ? `?code=${encodeURIComponent(code)}` : '';
  return proxyBackend(req, `/workshops/${encodeURIComponent(id)}/by-code${q}`, { method: 'GET' });
}
