'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

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

export default function NuevoTestPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const workshopId = params.id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      type: 'multiple_choice',
      prompt: 'Pregunta de ejemplo',
      points: 10,
      options: [{ text: 'Opción A' }, { text: 'Opción B' }],
      correctOptionIndex: 0,
    },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalPoints = useMemo(() => questions.reduce((acc, q) => acc + (q.points || 0), 0), [questions]);

  function addQuestion(type: QuestionType) {
    setQuestions((prev) => {
      if (type === 'open') {
        return [...prev, { type: 'open', prompt: '', points: 10 }];
      }
      return [
        ...prev,
        {
          type: 'multiple_choice',
          prompt: '',
          points: 10,
          options: [{ text: '' }, { text: '' }],
          correctOptionIndex: 0,
        },
      ];
    });
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('El título es obligatorio.');
      return;
    }

    if (questions.length < 1) {
      setError('Agrega al menos una pregunta.');
      return;
    }

    for (const q of questions) {
      if (!q.prompt.trim()) {
        setError('Todas las preguntas requieren enunciado.');
        return;
      }

      if (q.type === 'multiple_choice') {
        if (!q.options || q.options.length < 2) {
          setError('Las preguntas de opción múltiple requieren al menos 2 opciones.');
          return;
        }
        if (q.options.some((o) => !o.text.trim())) {
          setError('Todas las opciones deben tener texto.');
          return;
        }
        if (q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
          setError('Índice de opción correcta inválido.');
          return;
        }
      }
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
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href={`/talleres/${workshopId}`}
              className="text-sm font-semibold text-indigo-300 hover:text-indigo-200"
            >
              ← Volver al taller
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Crear test</h1>
            <p className="mt-1 text-sm text-zinc-400">Se crea en borrador. Total puntos: {totalPoints}.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div>
              <label className="text-sm font-semibold text-zinc-200">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                required
                minLength={3}
              />
            </div>
            <div className="mt-4">
              <label className="text-sm font-semibold text-zinc-200">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 min-h-[90px] w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => addQuestion('multiple_choice')}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/10"
            >
              + Opción múltiple
            </button>
            <button
              type="button"
              onClick={() => addQuestion('open')}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/10"
            >
              + Abierta
            </button>
          </div>

          {questions.map((q, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-200">
                    Pregunta {idx + 1} ({q.type === 'multiple_choice' ? 'opción múltiple' : 'abierta'})
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">Puntos</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeQuestion(idx)}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-semibold text-zinc-100 hover:bg-black/30"
                >
                  Quitar
                </button>
              </div>

              <div className="mt-4">
                <label className="text-sm font-semibold text-zinc-200">Enunciado</label>
                <textarea
                  value={q.prompt}
                  onChange={(e) => {
                    const v = e.target.value;
                    setQuestions((prev) => prev.map((it, i) => (i === idx ? ({ ...it, prompt: v } as any) : it)));
                  }}
                  className="mt-2 min-h-[90px] w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-indigo-500"
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
                  }}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  min={0}
                  max={100}
                  required
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
                        }}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-indigo-500"
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
                        }}
                        className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-semibold text-zinc-100 hover:bg-black/30"
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
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/10"
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
                        }}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-indigo-500"
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
            </div>
          ))}

          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
          ) : null}

          <div className="flex gap-3">
            <Link
              href={`/talleres/${workshopId}`}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-100 hover:bg-white/10"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {loading ? 'Creando…' : 'Crear test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
