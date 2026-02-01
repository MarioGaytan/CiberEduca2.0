'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type MeResponse =
  | { authenticated: true; user: { username: string; role: string } }
  | { authenticated: false };

type InboxAttempt = {
  _id: string;
  testId: string;
  testTitle?: string;
};

type Workshop = {
  _id: string;
  title: string;
  status: 'draft' | 'in_review' | 'approved';
};

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [inbox, setInbox] = useState<InboxAttempt[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = (await res.json()) as MeResponse;

      if (!alive) return;
      if (!res.ok || !data.authenticated) {
        router.replace('/login');
        return;
      }

      // Redirect students to Home - Dashboard is for staff only
      if (data.user.role === 'student') {
        router.replace('/home');
        return;
      }

      setMe(data);

      // Fetch inbox for teachers/admin
      if (data.user.role === 'teacher' || data.user.role === 'admin') {
        const inboxRes = await fetch('/api/tests/inbox/attempts', { cache: 'no-store' });
        const inboxData = (await inboxRes.json().catch(() => [])) as any;
        if (alive && Array.isArray(inboxData)) setInbox(inboxData);
      }

      // Fetch workshops for teachers/admin/reviewer
      const wsRes = await fetch('/api/workshops', { cache: 'no-store' });
      const wsData = (await wsRes.json().catch(() => [])) as any;
      if (alive && Array.isArray(wsData)) setWorkshops(wsData);

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  const role = useMemo(() => {
    if (!me || !me.authenticated) return '';
    return me.user.role;
  }, [me]);

  async function onLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  if (loading || !me || !me.authenticated) {
    return (
      <div className="ce-card p-6 text-sm text-zinc-300">Cargando…</div>
    );
  }

  const drafts = workshops.filter((w) => w.status === 'draft').length;
  const inReview = workshops.filter((w) => w.status === 'in_review').length;

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="ce-chip">Dashboard</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Hola, <span className="ce-title-gradient">{me.user.username}</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-300">
            Panel de <span className="font-semibold text-zinc-100 capitalize">{role}</span>
          </p>
        </div>
        <button
          onClick={onLogout}
          className="ce-btn ce-btn-ghost mt-4 w-fit sm:mt-0"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Stats row */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(role === 'teacher' || role === 'admin') && (
          <div className="ce-card p-5">
            <div className="text-sm font-semibold text-zinc-200">Bandeja</div>
            <div className="mt-2 text-2xl font-semibold text-amber-300">{inbox.length}</div>
            <div className="mt-1 text-xs text-zinc-400">Intentos por calificar</div>
          </div>
        )}
        <div className="ce-card p-5">
          <div className="text-sm font-semibold text-zinc-200">Talleres</div>
          <div className="mt-2 text-2xl font-semibold text-fuchsia-300">{workshops.length}</div>
          <div className="mt-1 text-xs text-zinc-400">Total creados</div>
        </div>
        {(role === 'teacher' || role === 'admin') && (
          <>
            <div className="ce-card p-5">
              <div className="text-sm font-semibold text-zinc-200">Borradores</div>
              <div className="mt-2 text-2xl font-semibold text-zinc-400">{drafts}</div>
              <div className="mt-1 text-xs text-zinc-400">Sin publicar</div>
            </div>
            <div className="ce-card p-5">
              <div className="text-sm font-semibold text-zinc-200">En revisión</div>
              <div className="mt-2 text-2xl font-semibold text-cyan-300">{inReview}</div>
              <div className="mt-1 text-xs text-zinc-400">Esperando aprobación</div>
            </div>
          </>
        )}
      </div>

      {/* Actions grid */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Teacher actions */}
        {(role === 'teacher' || role === 'admin') && (
          <>
            <Link href="/talleres/nuevo" className="ce-card ce-card-hover block p-5">
              <div className="text-sm font-semibold text-zinc-200">Crear taller</div>
              <div className="mt-2 text-sm text-zinc-400">
                Nuevo borrador con tests de opción múltiple o abiertas.
              </div>
              <div className="mt-4">
                <span className="ce-btn ce-btn-primary">+ Crear taller</span>
              </div>
            </Link>

            <Link href="/intentos" className="ce-card ce-card-hover block p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-zinc-200">Calificar intentos</div>
                {inbox.length > 0 && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                    {inbox.length}
                  </span>
                )}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                Revisar preguntas abiertas de tus alumnos.
              </div>
              <div className="mt-4">
                <span className="ce-btn ce-btn-ghost">Ver bandeja</span>
              </div>
            </Link>

            <Link href="/talleres" className="ce-card ce-card-hover block p-5">
              <div className="text-sm font-semibold text-zinc-200">Mis talleres</div>
              <div className="mt-2 text-sm text-zinc-400">
                Editar, enviar a revisión o ver estadísticas.
              </div>
              <div className="mt-4">
                <span className="ce-btn ce-btn-ghost">Ver talleres</span>
              </div>
            </Link>
          </>
        )}

        {/* Reviewer/Admin actions */}
        {(role === 'reviewer' || role === 'admin') && (
          <Link href="/admin/revision" className="ce-card ce-card-hover block p-5">
            <div className="text-sm font-semibold text-zinc-200">Bandeja de revisión</div>
            <div className="mt-2 text-sm text-zinc-400">
              Aprobar o rechazar talleres y tests antes de publicarlos.
            </div>
            <div className="mt-4">
              <span className="ce-btn ce-btn-soft">Abrir revisión</span>
            </div>
          </Link>
        )}

        {/* Admin-only */}
        {role === 'admin' && (
          <Link href="/admin/usuarios" className="ce-card ce-card-hover block p-5">
            <div className="text-sm font-semibold text-zinc-200">Administrar usuarios</div>
            <div className="mt-2 text-sm text-zinc-400">
              Crear maestros, revisores y alumnos.
            </div>
            <div className="mt-4">
              <span className="ce-btn ce-btn-soft">Gestionar</span>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
