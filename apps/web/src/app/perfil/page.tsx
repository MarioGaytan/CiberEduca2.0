'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type MeResponse =
  | { authenticated: true; user: { username: string; role: string } }
  | { authenticated: false };

export default function PerfilPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const role = useMemo(() => (me && me.authenticated ? me.user.role : ''), [me]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = (await res.json()) as MeResponse;
      if (!alive) return;
      setMe(data);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function onLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  if (loading || !me || !me.authenticated) {
    return (
      <div className="ce-card p-6 text-sm text-zinc-300">Cargando…</div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="ce-chip">Perfil</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">{me.user.username}</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Rol: <span className="capitalize font-semibold text-zinc-100">{role}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/home"
            className="ce-btn ce-btn-ghost"
          >
            Inicio
          </Link>
          <button
            onClick={onLogout}
            className="ce-btn ce-btn-danger"
            type="button"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="ce-card ce-card-hover p-5">
          <div className="text-sm font-semibold text-zinc-200">Accesos</div>
          <div className="mt-3 space-y-2">
            <Link href="/talleres" className="block text-sm font-semibold text-indigo-300 hover:text-indigo-200">
              Talleres
            </Link>
            {role === 'teacher' || role === 'admin' ? (
              <Link href="/intentos" className="block text-sm font-semibold text-indigo-300 hover:text-indigo-200">
                Bandeja de intentos
              </Link>
            ) : null}
            <Link href="/dashboard" className="block text-sm font-semibold text-indigo-300 hover:text-indigo-200">
              Dashboard
            </Link>
          </div>
        </div>

        <div className="lg:col-span-2 ce-card p-5">
          <div className="text-sm font-semibold text-zinc-200">Preferencias</div>
          <div className="mt-2 text-sm text-zinc-400">
            Próximamente: avatar, modo oscuro/neón, notificaciones y ajustes de accesibilidad.
          </div>
        </div>
      </div>
    </div>
  );
}
