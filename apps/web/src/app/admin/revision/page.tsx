'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type MeResponse =
  | { authenticated: true; user: { username: string; role: string } }
  | { authenticated: false };

type Workshop = {
  _id: string;
  title: string;
  description?: string;
  status: 'draft' | 'in_review' | 'approved';
  createdAt?: string;
};

type Test = {
  _id: string;
  title: string;
  description?: string;
  status?: 'draft' | 'in_review' | 'approved';
  workshopId: string;
  createdAt?: string;
};

type Tab = 'workshops' | 'tests';

export default function AdminRevisionPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [tab, setTab] = useState<Tab>('workshops');

  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [tests, setTests] = useState<Test[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const role = useMemo(() => (me && me.authenticated ? me.user.role : ''), [me]);
  const canReview = role === 'admin' || role === 'reviewer';

  async function loadAll() {
    setError(null);
    setLoading(true);

    const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
    const meData = (await meRes.json()) as MeResponse;
    setMe(meData);

    if (!meRes.ok || !meData.authenticated) {
      setLoading(false);
      return;
    }

    const [wsRes, tRes] = await Promise.all([
      fetch('/api/admin/review/workshops', { cache: 'no-store' }),
      fetch('/api/admin/review/tests', { cache: 'no-store' }),
    ]);

    const wsData = (await wsRes.json().catch(() => undefined)) as any;
    const tData = (await tRes.json().catch(() => undefined)) as any;

    if (!wsRes.ok) {
      setError((wsData && (wsData.message || wsData.error)) || 'No se pudieron cargar talleres en revisión.');
      setLoading(false);
      return;
    }

    if (!tRes.ok) {
      setError((tData && (tData.message || tData.error)) || 'No se pudieron cargar tests en revisión.');
      setLoading(false);
      return;
    }

    setWorkshops(Array.isArray(wsData) ? (wsData as Workshop[]) : []);
    setTests(Array.isArray(tData) ? (tData as Test[]) : []);
    setLoading(false);
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function actionPost(path: string, id: string, body?: any) {
    setError(null);
    setBusyId(id);

    const res = await fetch(path, {
      method: 'POST',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = (await res.json().catch(() => undefined)) as any;
    if (!res.ok) {
      setError((data && (data.message || data.error)) || 'No se pudo completar la acción.');
      setBusyId(null);
      return;
    }

    setBusyId(null);
    await loadAll();
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="ce-chip">Revisión</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Bandeja de revisión</h1>
          <p className="mt-2 text-sm text-zinc-400">Aprobar o rechazar talleres y tests en revisión.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={role === 'admin' ? '/admin/usuarios' : '/home'}
            className="ce-btn ce-btn-ghost"
          >
            {role === 'admin' ? 'Usuarios' : 'Inicio'}
          </Link>
          <button
            type="button"
            onClick={loadAll}
            className="ce-btn ce-btn-ghost"
          >
            Recargar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 ce-card p-6 text-sm text-zinc-300">Cargando…</div>
      ) : !me || !me.authenticated ? (
        <div className="mt-8 ce-card p-6 text-sm text-zinc-300">No autenticado.</div>
      ) : !canReview ? (
        <div className="mt-8 ce-card p-6 text-sm text-zinc-300">No tienes permisos.</div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setTab('workshops')}
              className={
                tab === 'workshops'
                  ? 'ce-btn ce-btn-ghost bg-white/10'
                  : 'ce-btn ce-btn-ghost'
              }
            >
              Talleres ({workshops.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('tests')}
              className={
                tab === 'tests'
                  ? 'ce-btn ce-btn-ghost bg-white/10'
                  : 'ce-btn ce-btn-ghost'
              }
            >
              Tests ({tests.length})
            </button>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200">{error}</div>
          ) : null}

          {tab === 'workshops' ? (
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {workshops.length === 0 ? (
                <div className="ce-card p-6 text-sm text-zinc-300">No hay talleres en revisión.</div>
              ) : (
                workshops.map((w) => (
                  <div key={w._id} className="ce-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-zinc-100">{w.title}</div>
                        {w.description ? <div className="mt-2 text-sm text-zinc-400">{w.description}</div> : null}
                        <div className="mt-3 text-xs text-zinc-500 capitalize">{w.status.replace('_', ' ')}</div>
                      </div>
                      <Link
                        href={`/talleres/${w._id}`}
                        className="ce-btn ce-btn-soft px-3 py-2 text-xs"
                      >
                        Ver
                      </Link>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => actionPost(`/api/workshops/${w._id}/approve`, w._id, { feedback: 'Aprobado' })}
                        disabled={busyId === w._id}
                        className="ce-btn ce-btn-success"
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        onClick={() => actionPost(`/api/workshops/${w._id}/reject`, w._id, { feedback: 'Rechazado' })}
                        disabled={busyId === w._id}
                        className="ce-btn ce-btn-danger"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {tests.length === 0 ? (
                <div className="ce-card p-6 text-sm text-zinc-300">No hay tests en revisión.</div>
              ) : (
                tests.map((t) => (
                  <div key={t._id} className="ce-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-zinc-100">{t.title}</div>
                        {t.description ? <div className="mt-2 text-sm text-zinc-400">{t.description}</div> : null}
                        <div className="mt-3 text-xs text-zinc-500 capitalize">{(t.status ?? 'draft').replace('_', ' ')}</div>
                      </div>
                      <Link
                        href={`/tests/${t._id}`}
                        className="ce-btn ce-btn-soft px-3 py-2 text-xs"
                      >
                        Ver
                      </Link>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => actionPost(`/api/tests/${t._id}/approve`, t._id, { feedback: 'Aprobado' })}
                        disabled={busyId === t._id}
                        className="ce-btn ce-btn-success"
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        onClick={() => actionPost(`/api/tests/${t._id}/reject`, t._id, { feedback: 'Rechazado' })}
                        disabled={busyId === t._id}
                        className="ce-btn ce-btn-danger"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
