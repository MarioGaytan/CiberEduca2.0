import { proxyBackend } from '../../../_lib/backend';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyBackend(req, `/tests/${encodeURIComponent(id)}/submit`, { method: 'POST' });
}
