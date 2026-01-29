'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Workshop = {
  _id: string;
  title: string;
  description?: string;
  status: 'draft' | 'in_review' | 'approved';
  visibility: 'internal' | 'code';
  reviewerFeedback?: string;
};

type TestItem = {
  _id: string;
  title: string;
  description?: string;
  status: 'draft' | 'in_review' | 'approved';
};

type MeResponse =
  | { authenticated: true; user: { username: string; role: string } }
  | { authenticated: false };

export default function TallerDetallePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [me, setMe] = useState<MeResponse | null>(null);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = useMemo(() => (me && me.authenticated ? me.user.role : ''), [me]);

  async function reloadAll() {
    setError(null);
    const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
    const meData = (await meRes.json()) as MeResponse;
    setMe(meData);

    if (!meRes.ok || !meData.authenticated) {
      setLoading(false);
      return;
    }

    const wsRes = await fetch(`/api/workshops/${id}`, { cache: 'no-store' });
    const wsData = (await wsRes.json().catch(() => undefined)) as any;
    if (!wsRes.ok) {
      setError((wsData && (wsData.message || wsData.error)) || 'No se pudo cargar el taller.');
      setLoading(false);
      return;
    }

    setWorkshop(wsData as Workshop);

    const testsRes = await fetch(`/api/tests/workshop/${id}`, { cache: 'no-store' });
    const testsData = (await testsRes.json().catch(() => undefined)) as any;
    if (testsRes.ok && Array.isArray(testsData)) {
      setTests(testsData as TestItem[]);
    } else {
      setTests([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void reloadAll();
  }, [id]);

  async function actionPost(path: string, body?: any) {
    setError(null);
    const res = await fetch(path, {
      method: 'POST',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json().catch(() => undefined)) as any;
    if (!res.ok) {
      setError((data && (data.message || data.error)) || 'No se pudo completar la acción.');
      return;
    }
    await reloadAll();
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/talleres" className="text-sm font-semibold text-indigo-300 hover:text-indigo-200">
            ← Volver a talleres
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{workshop?.title ?? 'Taller'}</h1>
          {workshop?.description ? (
            <p className="mt-2 text-sm text-zinc-300">{workshop.description}</p>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">Sin descripción</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.replace('/dashboard')}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/10"
          >
            Dashboard
          </button>

          {workshop && (role === 'teacher' || role === 'admin') && workshop.status === 'draft' ? (
            <button
              onClick={() => actionPost(`/api/workshops/${id}/submit`)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Enviar a revisión
            </button>
          ) : null}

          {workshop && (role === 'reviewer' || role === 'admin') && workshop.status === 'in_review' ? (
            <>
              <button
                onClick={() => actionPost(`/api/workshops/${id}/approve`, { feedback: 'Aprobado' })}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Aprobar
              </button>
              <button
                onClick={() => actionPost(`/api/workshops/${id}/reject`, { feedback: 'Rechazado' })}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
              >
                Rechazar
              </button>
            </>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">Cargando…</div>
      ) : error ? (
        <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">{error}</div>
      ) : !me || !me.authenticated ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">No autenticado.</div>
      ) : !workshop ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">Taller no encontrado.</div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold text-zinc-200">Estado</div>
            <div className="mt-2 text-2xl font-semibold capitalize">{workshop.status.replace('_', ' ')}</div>
            {workshop.reviewerFeedback ? (
              <div className="mt-3 text-sm text-zinc-400">Feedback: {workshop.reviewerFeedback}</div>
            ) : null}
            <div className="mt-3 text-sm text-zinc-400">Visibilidad: {workshop.visibility}</div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-200">Tests</div>
                <div className="mt-1 text-sm text-zinc-400">Tests asociados a este taller.</div>
              </div>
              {role === 'teacher' || role === 'admin' ? (
                <Link
                  href={`/talleres/${id}/tests/nuevo`}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Crear test
                </Link>
              ) : null}
            </div>

            {tests.length === 0 ? (
              <div className="mt-4 text-sm text-zinc-400">Aún no hay tests.</div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3">
                {tests.map((t) => (
                  <Link
                    key={t._id}
                    href={`/tests/${t._id}`}
                    className="block rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-black/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-zinc-100">{t.title}</div>
                        {t.description ? <div className="mt-1 text-sm text-zinc-400">{t.description}</div> : null}
                      </div>
                      <div className="text-xs text-zinc-400 capitalize">{t.status.replace('_', ' ')}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
