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
      correctOptionIndex: number;
    }
  | {
      type: 'open';
      prompt: string;
      points: number;
    };

type Test = {
  _id: string;
  workshopId: string;
  title: string;
  description?: string;
  status?: 'draft' | 'in_review' | 'approved';
  questions: Question[];
};

type QuestionType = 'multiple_choice' | 'open';

type QuestionDraft =
  | {
      type: 'multiple_choice';
      prompt: string;
      points: number;
      options: { text: string }[];
      correctOptionIndex: number;
    }
  | {
      type: 'open';
      prompt: string;
      points: number;
    };

export default function EditarTestPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [me, setMe] = useState<MeResponse | null>(null);
  const [test, setTest] = useState<Test | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);

  const [previewMode, setPreviewMode] = useState(false);
  const [previewMcAnswers, setPreviewMcAnswers] = useState<Record<number, number>>({});
  const [previewOpenAnswers, setPreviewOpenAnswers] = useState<Record<number, string>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionErrors, setQuestionErrors] = useState<Record<number, string[]>>({});

  const role = useMemo(() => (me && me.authenticated ? me.user.role : ''), [me]);
  const canEdit = role === 'teacher' || role === 'admin';

  const totalPoints = useMemo(() => questions.reduce((acc, q) => acc + (q.points || 0), 0), [questions]);

  function moveQuestion(from: number, to: number) {
    setQuestions((prev) => {
      if (from < 0 || from >= prev.length) return prev;
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function duplicateQuestion(index: number) {
    setQuestions((prev) => {
      const q = prev[index];
      if (!q) return prev;
      const clone = JSON.parse(JSON.stringify(q)) as QuestionDraft;
      const next = [...prev];
      next.splice(index + 1, 0, clone);
      return next;
    });
  }

  function validateAll(input: { title: string; questions: QuestionDraft[] }) {
    const errs: Record<number, string[]> = {};

    if (!input.title.trim()) {
      return { ok: false, formError: 'El título es obligatorio.', questionErrors: errs };
    }

    if (input.questions.length < 1) {
      return { ok: false, formError: 'Agrega al menos una pregunta.', questionErrors: errs };
    }

    input.questions.forEach((q, idx) => {
      const qErrs: string[] = [];

      if (!q.prompt.trim()) qErrs.push('Enunciado requerido.');
      if (typeof q.points !== 'number' || Number.isNaN(q.points) || q.points < 0) qErrs.push('Puntos inválidos.');

      if (q.type === 'multiple_choice') {
        if (!q.options || q.options.length < 2) qErrs.push('Requiere al menos 2 opciones.');
        if (q.options?.some((o) => !o.text.trim())) qErrs.push('Todas las opciones deben tener texto.');
        if (q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) qErrs.push('Correcta inválida.');
      }

      if (qErrs.length) errs[idx] = qErrs;
    });

    if (Object.keys(errs).length > 0) {
      return { ok: false, formError: 'Revisa las preguntas marcadas.', questionErrors: errs };
    }

    return { ok: true, formError: null as string | null, questionErrors: errs };
  }

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

      const t = data as Test;
      setTest(t);
      setTitle(t.title ?? '');
      setDescription(t.description ?? '');
      setQuestions((t.questions ?? []) as any);
      setQuestionErrors({});

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  function addQuestion(type: QuestionType) {
    setQuestions((prev) => {
      if (type === 'open') {
        return [...prev, { type: 'open', prompt: '', points: 10 }];
      }
      return [
        ...prev,
        { type: 'multiple_choice', prompt: '', points: 10, options: [{ text: '' }, { text: '' }], correctOptionIndex: 0 },
      ];
    });
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setQuestionErrors((prev) => {
      const next: Record<number, string[]> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const idx = Number(k);
        if (Number.isNaN(idx)) return;
        if (idx < index) next[idx] = v;
        if (idx > index) next[idx - 1] = v;
      });
      return next;
    });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!test) return;

    setError(null);
    setQuestionErrors({});

    if (!canEdit) {
      setError('No tienes permisos para editar.');
      return;
    }

    if ((test.status ?? 'draft') !== 'draft') {
      setError('Solo puedes editar un test en borrador.');
      return;
    }

    const validation = validateAll({ title, questions });
    if (!validation.ok) {
      setError(validation.formError);
      setQuestionErrors(validation.questionErrors);
      return;
    }

    setSaving(true);

    const res = await fetch(`/api/tests/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        questions,
      }),
    });

    const data = (await res.json().catch(() => undefined)) as any;
    if (!res.ok) {
      setError((data && (data.message || data.error)) || 'No se pudo guardar.');
      setSaving(false);
      return;
    }

    setSaving(false);
    router.replace(`/tests/${id}`);
  }

  if (loading) {
    return <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">Cargando…</div>;
  }

  if (!test) {
    return <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">Test no encontrado.</div>;
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href={`/tests/${id}`} className="text-sm font-semibold text-fuchsia-300 hover:text-fuchsia-200">
            ← Volver al test
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Editar test</h1>
          <p className="mt-1 text-sm text-zinc-400">Total puntos: {totalPoints}. Solo editable en borrador.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/talleres/${test.workshopId}`}
            className="ce-btn ce-btn-soft"
          >
            Ir al taller
          </Link>
        </div>
      </div>

      <form onSubmit={onSave} className="mt-8 space-y-4">
        <div className="ce-card p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-zinc-200">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="ce-field mt-2"
                required
                minLength={3}
                disabled={!canEdit || (test.status ?? 'draft') !== 'draft'}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-zinc-200">Estado</label>
              <div className="mt-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200 capitalize">
                {(test.status ?? 'draft').replace('_', ' ')}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-semibold text-zinc-200">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="ce-field mt-2 min-h-[100px]"
              disabled={!canEdit || (test.status ?? 'draft') !== 'draft'}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className={
                !previewMode
                  ? 'ce-btn ce-btn-primary'
                  : 'ce-btn ce-btn-ghost'
              }
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className={
                previewMode
                  ? 'ce-btn ce-btn-primary'
                  : 'ce-btn ce-btn-ghost'
              }
            >
              Preview alumno
            </button>
          </div>

          {!previewMode ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => addQuestion('multiple_choice')}
                disabled={!canEdit || (test.status ?? 'draft') !== 'draft'}
                className="ce-btn ce-btn-soft disabled:opacity-60"
              >
                + Opción múltiple
              </button>
              <button
                type="button"
                onClick={() => addQuestion('open')}
                disabled={!canEdit || (test.status ?? 'draft') !== 'draft'}
                className="ce-btn ce-btn-soft disabled:opacity-60"
              >
                + Abierta
              </button>
            </div>
          ) : null}
        </div>

        {questions.map((q, idx) => (
          <div key={idx} className="ce-card ce-card-hover p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-200">
                  Pregunta {idx + 1} ({q.type === 'multiple_choice' ? 'opción múltiple' : 'abierta'})
                </div>
                <div className="mt-1 text-xs text-zinc-500">Puntos: {q.points}</div>
              </div>
              {!previewMode ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveQuestion(idx, idx - 1)}
                    disabled={idx === 0 || !canEdit || (test.status ?? 'draft') !== 'draft'}
                    className="ce-btn ce-btn-ghost px-3 py-2 disabled:opacity-60"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(idx, idx + 1)}
                    disabled={idx === questions.length - 1 || !canEdit || (test.status ?? 'draft') !== 'draft'}
                    className="ce-btn ce-btn-ghost px-3 py-2 disabled:opacity-60"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateQuestion(idx)}
                    disabled={!canEdit || (test.status ?? 'draft') !== 'draft'}
                    className="ce-btn ce-btn-soft px-3 py-2 disabled:opacity-60"
                  >
                    Duplicar
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(idx)}
                    disabled={!canEdit || (test.status ?? 'draft') !== 'draft'}
                    className="ce-btn ce-btn-danger px-3 py-2 disabled:opacity-60"
                  >
                    Quitar
                  </button>
                </div>
              ) : null}
            </div>

            {questionErrors[idx]?.length ? (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                {questionErrors[idx].join(' ')}
              </div>
            ) : null}

            {previewMode ? (
              <div className="mt-4">
                <div className="text-sm font-semibold text-zinc-200">Vista alumno</div>
                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-sm font-semibold text-zinc-100">{idx + 1}. {q.prompt || '—'}</div>
                  <div className="mt-1 text-xs text-zinc-500">Puntos: {q.points}</div>

                  {q.type === 'multiple_choice' ? (
                    <div className="mt-4 space-y-2">
                      {q.options.map((o, optIdx) => (
                        <label
                          key={optIdx}
                          className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:bg-black/30 active:translate-y-0"
                        >
                          <input
                            type="radio"
                            name={`preview-q-${idx}`}
                            className="h-4 w-4"
                            checked={previewMcAnswers[idx] === optIdx}
                            onChange={() => setPreviewMcAnswers((prev) => ({ ...prev, [idx]: optIdx }))}
                          />
                          <span className="text-zinc-100">{o.text || '—'}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <textarea
                        value={previewOpenAnswers[idx] ?? ''}
                        onChange={(e) => setPreviewOpenAnswers((prev) => ({ ...prev, [idx]: e.target.value }))}
                        className="ce-field min-h-[120px]"
                        placeholder="Escribe tu respuesta..."
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="mt-4">
                  <label className="text-sm font-semibold text-zinc-200">Enunciado</label>
                  <textarea
                    value={q.prompt}
                    onChange={(e) => {
                      const v = e.target.value;
                      setQuestions((prev) => prev.map((it, i) => (i === idx ? ({ ...it, prompt: v } as any) : it)));
                      setQuestionErrors((prev) => {
                        if (!prev[idx]) return prev;
                        const next = { ...prev };
                        delete next[idx];
                        return next;
                      });
                    }}
                    className="ce-field mt-2 min-h-[90px]"
                    required
                    disabled={!canEdit || (test.status ?? 'draft') !== 'draft'}
                  />
                </div>

                <div className="mt-4">
                  <label className="text-sm font-semibold text-zinc-200">Puntos</label>
                  <input
                    type="number"
                    value={q.points}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setQuestions((prev) => prev.map((it, i) => (i === idx ? ({ ...it, points: n } as any) : it)));
                      setQuestionErrors((prev) => {
                        if (!prev[idx]) return prev;
                        const next = { ...prev };
                        delete next[idx];
                        return next;
                      });
                    }}
                    className="ce-field mt-2"
                    min={0}
                    max={100}
                    required
                    disabled={!canEdit || (test.status ?? 'draft') !== 'draft'}
                  />
                </div>

                {q.type === 'multiple_choice' ? (
                  <div className="mt-4 space-y-3">
                    <div className="text-sm font-semibold text-zinc-200">Opciones</div>
                    {q.options.map((o, optIdx) => (
                      <div key={optIdx} className="flex gap-3">
                        <input
                          value={o.text}
                          onChange={(e) => {
                            const v = e.target.value;
                            setQuestions((prev) =>
                              prev.map((it, i) => {
                                if (i !== idx) return it;
                                if (it.type !== 'multiple_choice') return it;
                                const next = it.options.map((oo, oi) => (oi === optIdx ? { text: v } : oo));
                                return { ...it, options: next };
                              }),
                            );
                            setQuestionErrors((prev) => {
                              if (!prev[idx]) return prev;
                              const next = { ...prev };
                              delete next[idx];
                              return next;
                            });
                          }}
                          className="ce-field"
                          placeholder={`Opción ${optIdx + 1}`}
                          required
                          disabled={!canEdit || (test.status ?? 'draft') !== 'draft'}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setQuestions((prev) =>
                              prev.map((it, i) => {
                                if (i !== idx) return it;
                                if (it.type !== 'multiple_choice') return it;
                                const next = it.options.filter((_, oi) => oi !== optIdx);
                                const nextCorrect = Math.max(0, Math.min(it.correctOptionIndex, next.length - 1));
                                return { ...it, options: next, correctOptionIndex: nextCorrect };
                              }),
                            );
                            setQuestionErrors((prev) => {
                              if (!prev[idx]) return prev;
                              const next = { ...prev };
                              delete next[idx];
                              return next;
                            });
                          }}
                          disabled={!canEdit || (test.status ?? 'draft') !== 'draft'}
                          className="ce-btn ce-btn-danger px-3 py-2 disabled:opacity-60"
                        >
                          X
                        </button>
                      </div>
                    ))}

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setQuestions((prev) =>
                            prev.map((it, i) => {
                              if (i !== idx) return it;
                              if (it.type !== 'multiple_choice') return it;
                              return { ...it, options: [...it.options, { text: '' }] };
                            }),
                          );
                        }}
                        disabled={!canEdit || (test.status ?? 'draft') !== 'draft'}
                        className="ce-btn ce-btn-soft disabled:opacity-60"
                      >
                        + Opción
                      </button>

                      <div className="min-w-[240px]">
                        <label className="text-sm font-semibold text-zinc-200">Correcta</label>
                        <select
                          value={q.correctOptionIndex}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            setQuestions((prev) =>
                              prev.map((it, i) => {
                                if (i !== idx) return it;
                                if (it.type !== 'multiple_choice') return it;
                                return { ...it, correctOptionIndex: n };
                              }),
                            );
                            setQuestionErrors((prev) => {
                              if (!prev[idx]) return prev;
                              const next = { ...prev };
                              delete next[idx];
                              return next;
                            });
                          }}
                          disabled={!canEdit || (test.status ?? 'draft') !== 'draft'}
                          className="ce-field mt-2 disabled:opacity-60"
                        >
                          {q.options.map((_, oi) => (
                            <option key={oi} value={oi}>
                              Opción {oi + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        ))}

        {error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
        ) : null}

        <div className="flex gap-3">
          <Link
            href={`/tests/${id}`}
            className="ce-btn ce-btn-ghost"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !canEdit || (test.status ?? 'draft') !== 'draft'}
            className="ce-btn ce-btn-primary disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
