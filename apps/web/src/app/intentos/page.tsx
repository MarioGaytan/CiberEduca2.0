'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type MeResponse =
  | { authenticated: true; user: { username: string; role: string } }
  | { authenticated: false };

type InboxAttempt = {
  _id: string;
  testId: string;
  workshopId?: string;
  testTitle?: string;
  studentUserId: string;
  studentUsername?: string;
  autoScore: number;
  manualScore: number;
  totalScore: number;
  needsManualReview: boolean;
  submittedAt?: string;
};

export default function IntentosInboxPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [attempts, setAttempts] = useState<InboxAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score'>('newest');

  const role = useMemo(() => (me && me.authenticated ? me.user.role : ''), [me]);

  const filtered = useMemo(() => {
    let list = attempts;
    
    // Search filter
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((a) => {
        const haystack = `${a.testTitle ?? ''} ${a.studentUsername ?? ''} ${a.studentUserId}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === 'score') return b.totalScore - a.totalScore;
      if (sortBy === 'oldest') return (a.submittedAt || '').localeCompare(b.submittedAt || '');
      // newest (default)
      return (b.submittedAt || '').localeCompare(a.submittedAt || '');
    });

    return list;
  }, [attempts, search, sortBy]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setError(null);
      setLoading(true);

      const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
      const meData = (await meRes.json()) as MeResponse;
      if (!alive) return;
      setMe(meData);
      if (!meRes.ok || !meData.authenticated) {
        setLoading(false);
        return;
      }

      const res = await fetch('/api/tests/inbox/attempts', { cache: 'no-store' });
      const data = (await res.json().catch(() => undefined)) as any;
      if (!alive) return;

      if (!res.ok) {
        setError((data && (data.message || data.error)) || 'No se pudo cargar la bandeja.');
        setLoading(false);
        return;
      }

      setAttempts(Array.isArray(data) ? (data as InboxAttempt[]) : []);
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
          <h1 className="text-3xl font-semibold tracking-tight">Bandeja de intentos</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {attempts.length > 0 ? `${attempts.length} intento${attempts.length === 1 ? '' : 's'} pendiente${attempts.length === 1 ? '' : 's'} de revisión.` : 'Intentos que requieren revisión manual.'}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="ce-btn ce-btn-ghost"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {/* Filters - only show when there are attempts */}
      {!loading && attempts.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por test o alumno..."
              className="ce-field mt-0 w-full"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="ce-field mt-0 w-auto min-w-[140px] cursor-pointer"
            >
              <option value="newest">Más reciente</option>
              <option value="oldest">Más antiguo</option>
              <option value="score">Mayor puntaje</option>
            </select>
          </div>
        </div>
      )}

        {loading ? (
          <div className="mt-8 ce-card p-6 text-sm text-zinc-300">Cargando…</div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">{error}</div>
        ) : !me || !me.authenticated ? (
          <div className="mt-8 ce-card p-6 text-sm text-zinc-300">No autenticado.</div>
        ) : role !== 'teacher' && role !== 'admin' ? (
          <div className="mt-8 ce-card p-6 text-sm text-zinc-300">No tienes permisos para ver esta bandeja.</div>
        ) : attempts.length === 0 ? (
          <div className="mt-8 ce-card p-6">
            <div className="text-center">
              <div className="text-4xl">🎉</div>
              <div className="mt-3 text-sm font-semibold text-zinc-200">¡Todo al día!</div>
              <div className="mt-1 text-sm text-zinc-400">No hay intentos pendientes de revisión.</div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 ce-card p-6 text-sm text-zinc-300">No se encontraron intentos con esos filtros.</div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.map((a) => (
              <Link
                key={a._id}
                href={`/tests/${a.testId}/intentos`}
                className="ce-card ce-card-hover block p-5"
              >
                <div className="text-sm font-semibold text-zinc-100">{a.testTitle ?? 'Test'}</div>
                <div className="mt-2 text-sm text-zinc-400">
                  Alumno: <span className="font-medium text-zinc-200">{a.studentUsername || 'Usuario ' + a.studentUserId.slice(-6)}</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                  <span>Puntaje auto: {a.autoScore}</span>
                  <span>Total: {a.totalScore}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-block rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-200">
                    Pendiente de revisión
                  </span>
                  {a.submittedAt && (
                    <span className="text-xs text-zinc-500">
                      {new Date(a.submittedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}
