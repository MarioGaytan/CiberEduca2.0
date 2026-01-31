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
      options?: { text: string }[];
      correctOptionIndex?: number;
    }
  | {
      type: 'open';
      prompt: string;
      points: number;
    };

type Test = {
  _id: string;
  title: string;
  workshopId: string;
  questions: Question[];
};

type AttemptAnswer = {
  questionIndex: number;
  selectedOptionIndex?: number;
  textAnswer?: string;
  awardedPoints?: number;
};

type Attempt = {
  _id: string;
  studentUserId: string;
  answers: AttemptAnswer[];
  autoScore: number;
  manualScore: number;
  totalScore: number;
  needsManualReview: boolean;
  submittedAt?: string;
  gradedAt?: string;
};

export default function IntentosPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [me, setMe] = useState<MeResponse | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const role = useMemo(() => (me && me.authenticated ? me.user.role : ''), [me]);

  const [gradeDrafts, setGradeDrafts] = useState<Record<string, Record<number, number>>>({});

  async function loadAll() {
    setError(null);
    setSuccess(null);
    setLoading(true);

    const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
    const meData = (await meRes.json()) as MeResponse;
    setMe(meData);
    if (!meRes.ok || !meData.authenticated) {
      setLoading(false);
      return;
    }

    const testRes = await fetch(`/api/tests/${id}`, { cache: 'no-store' });
    const testData = (await testRes.json().catch(() => undefined)) as any;
    if (!testRes.ok) {
      setError((testData && (testData.message || testData.error)) || 'No se pudo cargar el test.');
      setLoading(false);
      return;
    }

    const attRes = await fetch(`/api/tests/${id}/attempts`, { cache: 'no-store' });
    const attData = (await attRes.json().catch(() => undefined)) as any;
    if (!attRes.ok) {
      setError((attData && (attData.message || attData.error)) || 'No se pudieron cargar los intentos.');
      setLoading(false);
      return;
    }

    setTest(testData as Test);
    setAttempts(Array.isArray(attData) ? (attData as Attempt[]) : []);

    setGradeDrafts((prev) => {
      const next = { ...prev };
      for (const a of Array.isArray(attData) ? (attData as Attempt[]) : []) {
        if (!next[a._id]) {
          const initial: Record<number, number> = {};
          for (const ans of a.answers) {
            if (typeof ans.awardedPoints === 'number') {
              initial[ans.questionIndex] = ans.awardedPoints;
            }
          }
          next[a._id] = initial;
        }
      }
      return next;
    });

    setLoading(false);
  }

  useEffect(() => {
    void loadAll();
  }, [id]);

  async function gradeAttempt(attemptId: string) {
    if (!test) return;
    setError(null);
    setSuccess(null);
    setSaving(attemptId);

    const draft = gradeDrafts[attemptId] ?? {};

    const grades = test.questions
      .map((q, idx) => {
        if (q.type !== 'open') return null;
        const awardedPoints = draft[idx];
        if (typeof awardedPoints !== 'number' || Number.isNaN(awardedPoints)) return null;
        return { questionIndex: idx, awardedPoints };
      })
      .filter(Boolean);

    const res = await fetch(`/api/tests/attempts/${attemptId}/grade`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ grades }),
    });

    const data = (await res.json().catch(() => undefined)) as any;
    if (!res.ok) {
      setError((data && (data.message || data.error)) || 'No se pudo guardar la calificación.');
      setSaving(null);
      return;
    }

    setSuccess('Calificación guardada.');
    setSaving(null);
    await loadAll();
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">Cargando…</div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/tests/${id}`} className="text-sm font-semibold text-fuchsia-300 hover:text-fuchsia-200">
            ← Volver al test
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Intentos</h1>
          <p className="mt-1 text-sm text-zinc-400">{test?.title}</p>
        </div>
        <button
          onClick={() => router.replace('/dashboard')}
          className="ce-btn ce-btn-ghost"
        >
          Dashboard
        </button>
      </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200">{error}</div>
        ) : null}

        {success ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm text-emerald-100">
            {success}
          </div>
        ) : null}

        {!me || !me.authenticated ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">No autenticado.</div>
        ) : role !== 'teacher' && role !== 'admin' ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
            No tienes permisos para ver intentos.
          </div>
        ) : attempts.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
            Aún no hay intentos.
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {attempts.map((a) => (
              <div key={a._id} className="ce-card p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-zinc-200">Alumno</div>
                    <div className="mt-1 text-sm text-zinc-400">{a.studentUserId}</div>
                    <div className="mt-2 text-xs text-zinc-500">
                      Auto: {a.autoScore} | Manual: {a.manualScore} | Total: {a.totalScore}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {a.needsManualReview ? 'Requiere revisión manual' : 'Calificado'}
                    </div>
                  </div>

                  {test && test.questions.some((q) => q.type === 'open') ? (
                    <button
                      onClick={() => gradeAttempt(a._id)}
                      disabled={saving === a._id}
                      className="ce-btn ce-btn-primary mt-3 w-fit sm:mt-0"
                    >
                      {saving === a._id ? 'Guardando…' : 'Guardar calificación'}
                    </button>
                  ) : null}
                </div>

                <div className="mt-5 space-y-3">
                  {test?.questions.map((q, qIdx) => {
                    const ans = a.answers.find((x) => x.questionIndex === qIdx);

                    if (q.type === 'multiple_choice') {
                      const selected = typeof ans?.selectedOptionIndex === 'number' ? ans.selectedOptionIndex : null;
                      const correct = typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : null;
                      return (
                        <div key={qIdx} className="rounded-xl border border-white/10 bg-black/20 p-4">
                          <div className="text-sm font-semibold text-zinc-100">
                            {qIdx + 1}. {q.prompt}
                          </div>
                          <div className="mt-2 text-sm text-zinc-300">
                            Respondida: {selected !== null ? `Opción ${selected + 1}` : '—'}
                          </div>
                          <div className="mt-1 text-sm text-zinc-400">
                            Correcta: {correct !== null ? `Opción ${correct + 1}` : '—'}
                          </div>
                          <div className="mt-2 text-xs text-zinc-500">Puntos: {q.points}</div>
                        </div>
                      );
                    }

                    const current = gradeDrafts[a._id]?.[qIdx];

                    return (
                      <div key={qIdx} className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <div className="text-sm font-semibold text-zinc-100">
                          {qIdx + 1}. {q.prompt}
                        </div>
                        <div className="mt-2 text-sm text-zinc-300 whitespace-pre-wrap">
                          {ans?.textAnswer ? ans.textAnswer : '—'}
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="text-xs text-zinc-500">Puntos máximos: {q.points}</div>
                          <div>
                            <label className="text-xs font-semibold text-zinc-200">Puntos otorgados</label>
                            <input
                              type="number"
                              value={typeof current === 'number' ? current : ''}
                              onChange={(e) => {
                                const n = Number(e.target.value);
                                setGradeDrafts((prev) => ({
                                  ...prev,
                                  [a._id]: {
                                    ...(prev[a._id] ?? {}),
                                    [qIdx]: n,
                                  },
                                }));
                              }}
                              className="ce-field"
                              min={0}
                              max={q.points}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
