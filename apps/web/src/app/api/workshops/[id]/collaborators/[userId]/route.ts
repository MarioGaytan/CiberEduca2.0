import { proxyBackend } from '../../../../_lib/backend';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const { id, userId } = await params;
  return proxyBackend(req, `/workshops/${id}/collaborators/${userId}`, {
    method: 'DELETE',
  });
}
