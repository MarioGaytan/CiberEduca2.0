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

  const role = useMemo(() => (me && me.authenticated ? me.user.role : ''), [me]);

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
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Bandeja de intentos</h1>
            <p className="mt-1 text-sm text-zinc-400">Intentos que requieren revisión manual.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/10"
            >
              Volver
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">Cargando…</div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">{error}</div>
        ) : !me || !me.authenticated ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">No autenticado.</div>
        ) : role !== 'teacher' && role !== 'admin' ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
            No tienes permisos para ver esta bandeja.
          </div>
        ) : attempts.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
            No hay intentos pendientes.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {attempts.map((a) => (
              <Link
                key={a._id}
                href={`/tests/${a.testId}/intentos`}
                className="block rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
              >
                <div className="text-sm font-semibold text-zinc-100">{a.testTitle ?? 'Test'}</div>
                <div className="mt-2 text-sm text-zinc-400">Alumno: {a.studentUserId}</div>
                <div className="mt-2 text-xs text-zinc-500">Auto: {a.autoScore} | Total: {a.totalScore}</div>
                <div className="mt-3 inline-block rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-xs text-zinc-300">
                  Pendiente
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
