'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type QuestionType = 'multiple_choice' | 'open';

type QuestionOption = {
  text: string;
  imageUrl?: string;
};

type QuestionDraft =
  | {
      type: 'multiple_choice';
      prompt: string;
      points: number;
      mediaUrl?: string;
      explanation?: string;
      hint?: string;
      options: QuestionOption[];
      correctOptionIndex: number;
    }
  | {
      type: 'open';
      prompt: string;
      points: number;
      mediaUrl?: string;
      explanation?: string;
      hint?: string;
    };

export default function NuevoTestPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const workshopId = params.id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [showAdvanced, setShowAdvanced] = useState<Record<number, boolean>>({});

  const [previewMode, setPreviewMode] = useState(false);
  const [previewMcAnswers, setPreviewMcAnswers] = useState<Record<number, number>>({});
  const [previewOpenAnswers, setPreviewOpenAnswers] = useState<Record<number, string>>({});

  const [questionErrors, setQuestionErrors] = useState<Record<number, string[]>>({});

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  function addQuestion(type: QuestionType) {
    setQuestions((prev) => {
      if (type === 'open') {
        return [...prev, { type: 'open', prompt: '', points: 10, mediaUrl: '', explanation: '', hint: '' }];
      }
      return [
        ...prev,
        {
          type: 'multiple_choice',
          prompt: '',
          points: 10,
          mediaUrl: '',
          explanation: '',
          hint: '',
          options: [{ text: '' }, { text: '' }],
          correctOptionIndex: 0,
        },
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setQuestionErrors({});

    const validation = validateAll({ title, questions });
    if (!validation.ok) {
      setError(validation.formError);
      setQuestionErrors(validation.questionErrors);
      return;
    }

    setLoading(true);

    const res = await fetch('/api/tests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        workshopId,
        title: title.trim(),
        description: description.trim() || undefined,
        questions,
      }),
    });

    const data = (await res.json().catch(() => undefined)) as any;
    if (!res.ok) {
      setError((data && (data.message || data.error)) || 'No se pudo crear el test.');
      setLoading(false);
      return;
    }

    router.replace(`/tests/${data._id}`);
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href={`/talleres/${workshopId}`} className="text-sm font-semibold text-fuchsia-300 hover:text-fuchsia-200">
            ← Volver al taller
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Crear test</h1>
          <p className="mt-1 text-sm text-zinc-400">Se crea en borrador. Total puntos: {totalPoints}.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="ce-card p-5">
          <div>
            <label className="text-sm font-semibold text-zinc-200">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ce-field mt-2"
              required
              minLength={3}
            />
          </div>
          <div className="mt-4">
            <label className="text-sm font-semibold text-zinc-200">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="ce-field mt-2 min-h-[90px]"
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
                className="ce-btn ce-btn-soft"
              >
                + Opción múltiple
              </button>
              <button
                type="button"
                onClick={() => addQuestion('open')}
                className="ce-btn ce-btn-soft"
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
                    disabled={idx === 0}
                    className="ce-btn ce-btn-ghost px-3 py-2 disabled:opacity-60"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(idx, idx + 1)}
                    disabled={idx === questions.length - 1}
                    className="ce-btn ce-btn-ghost px-3 py-2 disabled:opacity-60"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateQuestion(idx)}
                    className="ce-btn ce-btn-soft px-3 py-2"
                  >
                    Duplicar
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(idx)}
                    className="ce-btn ce-btn-danger px-3 py-2"
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
                  />
                </div>

                {/* Advanced options toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(prev => ({ ...prev, [idx]: !prev[idx] }))}
                  className="mt-4 text-sm text-fuchsia-300 hover:text-fuchsia-200"
                >
                  {showAdvanced[idx] ? '▼ Ocultar opciones avanzadas' : '▶ Mostrar opciones avanzadas'}
                </button>

                {showAdvanced[idx] && (
                  <div className="mt-4 space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Imagen o video (URL)</label>
                      <input
                        type="url"
                        value={q.mediaUrl || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setQuestions((prev) => prev.map((it, i) => (i === idx ? ({ ...it, mediaUrl: v } as any) : it)));
                        }}
                        className="ce-field mt-1"
                        placeholder="https://ejemplo.com/imagen.jpg o URL de YouTube"
                      />
                      {q.mediaUrl && (
                        <div className="mt-2">
                          {q.mediaUrl.includes('youtube.com') || q.mediaUrl.includes('youtu.be') ? (
                            <div className="text-xs text-green-400">✓ Video de YouTube detectado</div>
                          ) : (
                            <img
                              src={q.mediaUrl}
                              alt="Preview"
                              className="h-24 rounded-lg object-cover"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-zinc-300">Pista para el estudiante</label>
                      <input
                        value={q.hint || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setQuestions((prev) => prev.map((it, i) => (i === idx ? ({ ...it, hint: v } as any) : it)));
                        }}
                        className="ce-field mt-1"
                        placeholder="Una pista opcional que ayude al estudiante"
                        maxLength={200}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-zinc-300">Explicación (se muestra después de responder)</label>
                      <textarea
                        value={q.explanation || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setQuestions((prev) => prev.map((it, i) => (i === idx ? ({ ...it, explanation: v } as any) : it)));
                        }}
                        className="ce-field mt-1 min-h-[80px]"
                        placeholder="Explica por qué la respuesta es correcta (para aprendizaje)"
                        maxLength={2000}
                      />
                    </div>
                  </div>
                )}

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
                          className="ce-btn ce-btn-danger px-3 py-2"
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
                        className="ce-btn ce-btn-soft"
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
                          className="ce-field mt-2"
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
            href={`/talleres/${workshopId}`}
            className="ce-btn ce-btn-ghost"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading || previewMode}
            className="ce-btn ce-btn-primary disabled:opacity-60"
          >
            {loading ? 'Creando…' : 'Crear test'}
          </button>
        </div>
      </form>
    </div>
  );
}
