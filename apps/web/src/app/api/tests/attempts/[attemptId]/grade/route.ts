import { proxyBackend } from '../../../../_lib/backend';

export async function POST(req: Request, ctx: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await ctx.params;
  const body = (await req.json()) as unknown;
  return proxyBackend(req, `/tests/attempts/${encodeURIComponent(attemptId)}/grade`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
