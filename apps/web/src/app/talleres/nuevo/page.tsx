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
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Crear taller</h1>
      <p className="mt-1 text-sm text-zinc-400">Se crea en borrador. Luego puedes enviarlo a revisión.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="ce-card p-5">
          <div>
            <label className="text-sm font-semibold text-zinc-200">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ce-field"
              placeholder="Ej. Introducción a seguridad"
              required
              minLength={3}
            />
          </div>

          <div className="mt-4">
            <label className="text-sm font-semibold text-zinc-200">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="ce-field min-h-[120px]"
              placeholder="Descripción del taller (opcional)"
            />
          </div>

          <div className="mt-4">
            <label className="text-sm font-semibold text-zinc-200">Visibilidad</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as WorkshopVisibility)}
              className="ce-field"
            >
              <option value="internal">Interno</option>
              <option value="code">Por código</option>
            </select>
          </div>

          {visibility === 'code' ? (
            <div className="mt-4">
              <label className="text-sm font-semibold text-zinc-200">Código</label>
              <input
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="ce-field"
                placeholder="Código de acceso"
                required
                minLength={3}
              />
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
          ) : null}

          <div className="mt-4 flex gap-3">
            <button type="button" onClick={() => router.replace('/talleres')} className="ce-btn ce-btn-ghost py-3" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="ce-btn ce-btn-primary py-3" disabled={loading}>
              {loading ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
