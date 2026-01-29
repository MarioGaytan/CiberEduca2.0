'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type WorkshopVisibility = 'internal' | 'code';

export default function NuevoTallerPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<WorkshopVisibility>('internal');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload: any = {
      title,
      description: description || undefined,
      visibility,
    };

    if (visibility === 'code') {
      payload.accessCode = accessCode;
    }

    const res = await fetch('/api/workshops', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => undefined)) as any;

    if (!res.ok) {
      setError((data && (data.message || data.error)) || 'No se pudo crear el taller.');
      setLoading(false);
      return;
    }

    router.replace(`/talleres/${data._id}`);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Crear taller</h1>
        <p className="mt-1 text-sm text-zinc-400">Se crea en borrador. Luego puedes enviarlo a revisión.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-semibold text-zinc-200">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-indigo-500"
              placeholder="Ej. Introducción a seguridad"
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-zinc-200">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-indigo-500"
              placeholder="Descripción del taller (opcional)"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-zinc-200">Visibilidad</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as WorkshopVisibility)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-indigo-500"
            >
              <option value="internal">Interno</option>
              <option value="code">Por código</option>
            </select>
          </div>

          {visibility === 'code' ? (
            <div>
              <label className="text-sm font-semibold text-zinc-200">Código</label>
              <input
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                placeholder="Código de acceso"
                required
                minLength={3}
              />
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
          ) : null}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.replace('/talleres')}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-100 hover:bg-white/10"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
