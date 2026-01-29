import { proxyBackend } from '../../../_lib/backend';

export async function GET(req: Request, ctx: { params: Promise<{ workshopId: string }> }) {
  const { workshopId } = await ctx.params;
  return proxyBackend(req, `/tests/workshop/${encodeURIComponent(workshopId)}`, { method: 'GET' });
}
