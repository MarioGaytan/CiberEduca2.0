'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Workshop = {
  _id: string;
  title: string;
  description?: string;
  status: 'draft' | 'in_review' | 'approved';
  visibility: 'internal' | 'code';
  createdAt?: string;
};

type MeResponse =
  | { authenticated: true; user: { username: string; role: string } }
  | { authenticated: false };

export default function TalleresPage() {
  const searchParams = useSearchParams();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const role = useMemo(() => (me && me.authenticated ? me.user.role : ''), [me]);

  const q = (searchParams?.get('q') ?? '').trim().toLowerCase();
  const filtered = useMemo(() => {
    let list = workshops;
    
    // Students only see approved workshops
    if (role === 'student') {
      list = list.filter((w) => w.status === 'approved');
    }
    
    // Apply search filter
    if (q) {
      list = list.filter((w) => {
        const haystack = `${w.title ?? ''} ${w.description ?? ''}`.toLowerCase();
        return haystack.includes(q);
      });
    }
    
    return list;
  }, [q, workshops, role]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
      const meData = (await meRes.json()) as MeResponse;
      if (!alive) return;
      setMe(meData);
      if (!meRes.ok || !meData.authenticated) {
        setLoading(false);
        return;
      }

      const wsRes = await fetch('/api/workshops', { cache: 'no-store' });
      const wsData = (await wsRes.json()) as Workshop[];
      if (!alive) return;
      setWorkshops(Array.isArray(wsData) ? wsData : []);
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
          <h1 className="text-3xl font-semibold tracking-tight">Talleres</h1>
          <p className="mt-1 text-sm text-zinc-400">Lista de talleres disponibles según tu rol.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/home"
            className="ce-btn ce-btn-ghost"
          >
            Volver
          </Link>
          {role === 'teacher' || role === 'admin' ? (
            <Link
              href="/talleres/nuevo"
              className="ce-btn ce-btn-primary"
            >
              Crear taller
            </Link>
          ) : null}
        </div>
      </div>

        {loading ? (
          <div className="mt-8 ce-card p-6 text-sm text-zinc-300">Cargando…</div>
        ) : !me || !me.authenticated ? (
          <div className="mt-8 ce-card p-6 text-sm text-zinc-300">No autenticado. Inicia sesión para ver talleres.</div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 ce-card p-6 text-sm text-zinc-300">No hay talleres para mostrar.</div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.map((w) => (
              <Link
                key={w._id}
                href={`/talleres/${w._id}`}
                className="ce-card ce-card-hover block p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-zinc-200">{w.title}</div>
                    {w.description ? (
                      <div className="mt-2 text-sm text-zinc-400 line-clamp-3">{w.description}</div>
                    ) : null}
                  </div>
                  <div className="text-xs text-zinc-400">
                    <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 capitalize">
                      {w.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-zinc-500">
                  Visibilidad: {w.visibility}
                </div>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}
