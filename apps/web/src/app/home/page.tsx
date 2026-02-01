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
  visibility: 'internal' | 'code';
};

type InboxAttempt = {
  _id: string;
  testId: string;
  testTitle?: string;
  studentUserId: string;
};

export default function HomePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [inbox, setInbox] = useState<InboxAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const role = useMemo(() => (me && me.authenticated ? me.user.role : ''), [me]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
      const meData = (await meRes.json()) as MeResponse;
      if (!alive) return;
      setMe(meData);

      const wsRes = await fetch('/api/workshops', { cache: 'no-store' });
      const wsData = (await wsRes.json().catch(() => undefined)) as any;
      if (!alive) return;
      setWorkshops(Array.isArray(wsData) ? (wsData as Workshop[]) : []);

      if (meRes.ok && meData.authenticated && (meData.user.role === 'teacher' || meData.user.role === 'admin')) {
        const inboxRes = await fetch('/api/tests/inbox/attempts', { cache: 'no-store' });
        const inboxData = (await inboxRes.json().catch(() => undefined)) as any;
        if (!alive) return;
        setInbox(Array.isArray(inboxData) ? (inboxData as InboxAttempt[]) : []);
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="ce-chip">Inicio</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            {me && me.authenticated ? (
              <span>
                Hola, <span className="ce-title-gradient">{me.user.username}</span>
              </span>
            ) : (
              'CiberEduca'
            )}
          </h1>
          <p className="mt-2 text-sm text-zinc-300">Tu punto de partida: talleres, tests e intentos.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/talleres"
            className="ce-btn ce-btn-primary"
          >
            Ir a talleres
          </Link>
          <Link
            href="/perfil"
            className="ce-btn ce-btn-ghost"
          >
            Perfil
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 ce-card p-6 text-sm text-zinc-300">Cargando…</div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="ce-card ce-card-hover p-5">
            <div className="text-sm font-semibold text-zinc-200">Tu rol</div>
            <div className="mt-2 text-2xl font-semibold capitalize">{role}</div>
            <div className="mt-2 text-sm text-zinc-400">Accesos rápidos según permisos.</div>
          </div>

          {(role === 'teacher' || role === 'admin') ? (
            <div className="ce-card ce-card-hover p-5">
              <div className="text-sm font-semibold text-zinc-200">Bandeja</div>
              <div className="mt-2 text-2xl font-semibold">{inbox.length}</div>
              <div className="mt-2 text-sm text-zinc-400">Intentos pendientes de revisión manual.</div>
              <div className="mt-4">
                <Link href="/intentos" className="ce-btn ce-btn-ghost">
                  Ver intentos
                </Link>
              </div>
            </div>
          ) : (
            <div className="ce-card ce-card-hover p-5">
              <div className="text-sm font-semibold text-zinc-200">Progreso</div>
              <div className="mt-2 text-2xl font-semibold">0</div>
              <div className="mt-2 text-sm text-zinc-400">Se mostrará tu avance en próximos pasos.</div>
            </div>
          )}

          <div className="ce-card ce-card-hover p-5">
            <div className="text-sm font-semibold text-zinc-200">Acción rápida</div>
            <div className="mt-2 text-sm text-zinc-400">Explora y entra a un taller para ver sus tests.</div>
            <div className="mt-4">
              <Link href="/talleres" className="ce-btn ce-btn-ghost">
                Abrir talleres
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Talleres</h2>
            <p className="mt-1 text-sm text-zinc-400">Lista de talleres disponibles para ti.</p>
          </div>
        </div>

        {workshops.length === 0 ? (
          <div className="mt-4 ce-card p-6 text-sm text-zinc-300">No hay talleres.</div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {workshops.slice(0, 6).map((w) => (
              <Link
                key={w._id}
                href={`/talleres/${w._id}`}
                className="ce-card ce-card-hover block p-5"
              >
                <div className="text-sm font-semibold text-zinc-100">{w.title}</div>
                {w.description ? <div className="mt-2 text-sm text-zinc-400 line-clamp-2">{w.description}</div> : null}
                <div className="mt-3 text-xs text-zinc-500 capitalize">{w.status.replace('_', ' ')}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
