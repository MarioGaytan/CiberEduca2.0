import { proxyBackend } from '../../../_lib/backend';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyBackend(req, `/tests/${encodeURIComponent(id)}/attempts`, { method: 'GET' });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json()) as unknown;
  return proxyBackend(req, `/tests/${encodeURIComponent(id)}/attempts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
