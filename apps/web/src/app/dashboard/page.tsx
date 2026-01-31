'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type MeResponse =
  | { authenticated: true; user: { username: string; role: string } }
  | { authenticated: false };

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

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

      setMe(data);
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
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">Cargando…</div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-300">
            Bienvenido, <span className="font-semibold text-zinc-100">{me.user.username}</span>
          </p>
        </div>
        <button
          onClick={onLogout}
          className="ce-btn ce-btn-ghost mt-4 w-fit sm:mt-0"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="ce-card p-5">
          <div className="text-sm font-semibold text-zinc-200">Tu rol</div>
          <div className="mt-2 text-2xl font-semibold capitalize">{role}</div>
          <div className="mt-2 text-sm text-zinc-400">La interfaz se ajusta a tus permisos.</div>
        </div>

          {role === 'student' ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-semibold text-zinc-200">Talleres</div>
                <div className="mt-2 text-sm text-zinc-400">
                  Ver talleres aprobados y entrar por código cuando sea necesario.
                </div>
                <Link href="/talleres" className="mt-4 inline-block text-sm font-semibold text-indigo-300 hover:text-indigo-200">
                  Ver talleres
                </Link>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-semibold text-zinc-200">Tests</div>
                <div className="mt-2 text-sm text-zinc-400">
                  Responder tests de opción múltiple y abiertas.
                </div>
                <Link href="/talleres" className="mt-4 inline-block text-sm font-semibold text-indigo-300 hover:text-indigo-200">
                  Ver tests por taller
                </Link>
              </div>
            </>
          ) : null}

          {role === 'teacher' ? (
            <>
              <div className="ce-card ce-card-hover p-5">
                <div className="text-sm font-semibold text-zinc-200">Crear talleres</div>
                <div className="mt-2 text-sm text-zinc-400">
                  Crea borradores, envía a revisión y publica cuando sea aprobado.
                </div>
                <div className="mt-4">
                  <Link href="/talleres/nuevo" className="ce-btn ce-btn-primary">
                    Crear taller
                  </Link>
                </div>
              </div>
              <div className="ce-card ce-card-hover p-5">
                <div className="text-sm font-semibold text-zinc-200">Calificar abiertas</div>
                <div className="mt-2 text-sm text-zinc-400">
                  Las de opción múltiple se califican solas. Las abiertas se revisan.
                </div>
                <div className="mt-4">
                  <Link href="/intentos" className="ce-btn ce-btn-ghost">
                    Ver bandeja de intentos
                  </Link>
                </div>
              </div>
            </>
          ) : null}

          {role === 'reviewer' || role === 'admin' ? (
            <>
              <Link href="/admin/revision" className="ce-card ce-card-hover block p-5">
                <div className="text-sm font-semibold text-zinc-200">Revisión</div>
                <div className="mt-2 text-sm text-zinc-400">
                  Aprobar o rechazar talleres y tests antes de publicarlos.
                </div>
                <div className="mt-4">
                  <span className="ce-btn ce-btn-soft">Abrir bandeja</span>
                </div>
              </Link>
              {role === 'admin' ? (
                <Link href="/admin/usuarios" className="ce-card ce-card-hover block p-5">
                  <div className="text-sm font-semibold text-zinc-200">Usuarios</div>
                  <div className="mt-2 text-sm text-zinc-400">
                    Dar de alta profesores, revisores y alumnos.
                  </div>
                  <div className="mt-4">
                    <span className="ce-btn ce-btn-soft">Administrar</span>
                  </div>
                </Link>
              ) : null}
            </>
          ) : null}
        </div>
    </div>
  );
}
