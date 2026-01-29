'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type MeResponse =
  | { authenticated: true; user: { username: string; role: string } }
  | { authenticated: false };

type Question =
  | {
      type: 'multiple_choice';
      prompt: string;
      points: number;
      options: { text: string }[];
    }
  | {
      type: 'open';
      prompt: string;
      points: number;
    };

type Test = {
  _id: string;
  title: string;
  description?: string;
  workshopId: string;
  questions: Question[];
};

type SubmitResult = {
  _id: string;
  autoScore: number;
  manualScore: number;
  totalScore: number;
  needsManualReview: boolean;
};

export default function TestPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [me, setMe] = useState<MeResponse | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const role = useMemo(() => (me && me.authenticated ? me.user.role : ''), [me]);

  const [mcAnswers, setMcAnswers] = useState<Record<number, number>>({});
  const [openAnswers, setOpenAnswers] = useState<Record<number, string>>({});

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

      const res = await fetch(`/api/tests/${id}`, { cache: 'no-store' });
      const data = (await res.json().catch(() => undefined)) as any;
      if (!alive) return;

      if (!res.ok) {
        setError((data && (data.message || data.error)) || 'No se pudo cargar el test.');
        setLoading(false);
        return;
      }

      setTest(data as Test);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  async function onSubmitAttempt() {
    if (!test) return;
    setError(null);
    setSubmitting(true);

    const answers = test.questions.map((q, idx) => {
      if (q.type === 'multiple_choice') {
        const selectedOptionIndex = mcAnswers[idx];
        return {
          questionIndex: idx,
          selectedOptionIndex: typeof selectedOptionIndex === 'number' ? selectedOptionIndex : undefined,
        };
      }

      return {
        questionIndex: idx,
        textAnswer: openAnswers[idx] || undefined,
      };
    });

    const res = await fetch(`/api/tests/${id}/attempts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ answers }),
    });

    const data = (await res.json().catch(() => undefined)) as any;
    if (!res.ok) {
      setError((data && (data.message || data.error)) || 'No se pudo enviar el intento.');
      setSubmitting(false);
      return;
    }

    setResult(data as SubmitResult);
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/talleres" className="text-sm font-semibold text-indigo-300 hover:text-indigo-200">
              ← Talleres
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{test?.title ?? 'Test'}</h1>
            {test?.description ? <p className="mt-2 text-sm text-zinc-300">{test.description}</p> : null}
          </div>
          <button
            onClick={() => router.replace('/dashboard')}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/10"
          >
            Dashboard
          </button>
        </div>

        {loading ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">Cargando…</div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">{error}</div>
        ) : !me || !me.authenticated ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
            No autenticado.
          </div>
        ) : !test ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
            Test no encontrado.
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {role !== 'student' ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
                Este test está en modo lectura para tu rol: <span className="font-semibold">{role}</span>.
              </div>
            ) : null}

            {test.questions.map((q, idx) => (
              <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-semibold text-zinc-200">
                  {idx + 1}. {q.prompt}
                </div>
                <div className="mt-1 text-xs text-zinc-500">Puntos: {q.points}</div>

                {q.type === 'multiple_choice' ? (
                  <div className="mt-4 space-y-2">
                    {q.options.map((o, optIdx) => (
                      <label
                        key={optIdx}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm hover:bg-black/30"
                      >
                        <input
                          type="radio"
                          name={`q-${idx}`}
                          className="h-4 w-4"
                          checked={mcAnswers[idx] === optIdx}
                          onChange={() => setMcAnswers((prev) => ({ ...prev, [idx]: optIdx }))}
                          disabled={role !== 'student'}
                        />
                        <span className="text-zinc-100">{o.text}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4">
                    <textarea
                      value={openAnswers[idx] ?? ''}
                      onChange={(e) => setOpenAnswers((prev) => ({ ...prev, [idx]: e.target.value }))}
                      className="min-h-[120px] w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                      placeholder="Escribe tu respuesta..."
                      disabled={role !== 'student'}
                    />
                  </div>
                )}
              </div>
            ))}

            {result ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm text-emerald-100">
                Intento enviado.
                <div className="mt-2 text-emerald-100/90">
                  Puntaje automático: {result.autoScore}
                  <br />
                  Puntaje total: {result.totalScore}
                  <br />
                  {result.needsManualReview ? 'Pendiente de revisión manual.' : 'Calificado.'}
                </div>
              </div>
            ) : null}

            {role === 'student' ? (
              <button
                onClick={onSubmitAttempt}
                disabled={submitting}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {submitting ? 'Enviando…' : 'Enviar intento'}
              </button>
            ) : null}

            {test.workshopId ? (
              <Link
                href={`/talleres/${test.workshopId}`}
                className="block text-center text-sm font-semibold text-indigo-300 hover:text-indigo-200"
              >
                Volver al taller
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
