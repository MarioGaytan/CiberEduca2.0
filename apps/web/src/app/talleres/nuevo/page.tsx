'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ClipboardList, FileText, Settings, X } from 'lucide-react';
import ContentBlockEditor, { ContentBlock } from '../../_components/workshop/ContentBlockEditor';

type WorkshopVisibility = 'internal' | 'code';

export default function NuevoTallerPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>('');
  const [content, setContent] = useState<ContentBlock[]>([]);
  const [visibility, setVisibility] = useState<WorkshopVisibility>('internal');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'settings'>('info');

  function addObjective() {
    setObjectives([...objectives, '']);
  }

  function updateObjective(index: number, value: string) {
    setObjectives(objectives.map((o, i) => (i === index ? value : o)));
  }

  function removeObjective(index: number) {
    if (objectives.length <= 1) return;
    setObjectives(objectives.filter((_, i) => i !== index));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('El título es obligatorio.');
      return;
    }

    setLoading(true);

    const payload: any = {
      title: title.trim(),
      description: description.trim() || undefined,
      coverImageUrl: coverImageUrl.trim() || undefined,
      objectives: objectives.filter(o => o.trim()),
      estimatedMinutes: estimatedMinutes || undefined,
      content: content.length > 0 ? content : undefined,
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Crear taller</h1>
          <p className="mt-1 text-sm text-zinc-400">Se crea en borrador. Luego puedes enviarlo a revisión.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b border-white/10">
        {(['info', 'content', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-fuchsia-500 text-fuchsia-200'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab === 'info' && <span className="flex items-center gap-1.5"><ClipboardList className="h-4 w-4" /> Información</span>}
            {tab === 'content' && <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> Contenido</span>}
            {tab === 'settings' && <span className="flex items-center gap-1.5"><Settings className="h-4 w-4" /> Configuración</span>}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div className="ce-card p-5">
              <div className="text-sm font-semibold text-zinc-200 mb-4">Información básica</div>
              
              <div>
                <label className="text-sm font-medium text-zinc-300">Título *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="ce-field mt-1"
                  placeholder="Ej. Introducción a Ciberseguridad"
                  required
                  minLength={3}
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-zinc-300">Descripción corta</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="ce-field mt-1 min-h-[80px]"
                  placeholder="Resumen breve del taller (aparece en la lista)"
                  maxLength={500}
                />
                <div className="mt-1 text-xs text-zinc-500">{description.length}/500</div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-zinc-300">Imagen de portada (URL)</label>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  className="ce-field mt-1"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
                {coverImageUrl && (
                  <div className="mt-2">
                    <img
                      src={coverImageUrl}
                      alt="Portada"
                      className="h-32 rounded-lg object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-zinc-300">Duración estimada (minutos)</label>
                <input
                  type="number"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value ? Number(e.target.value) : '')}
                  className="ce-field mt-1"
                  placeholder="30"
                  min={1}
                  max={480}
                />
              </div>
            </div>

            <div className="ce-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-zinc-200">Objetivos de aprendizaje</div>
                <button
                  type="button"
                  onClick={addObjective}
                  className="text-sm text-fuchsia-300 hover:text-fuchsia-200"
                >
                  + Agregar
                </button>
              </div>
              <div className="space-y-2">
                {objectives.map((obj, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/20 text-sm font-bold text-fuchsia-300">
                      {idx + 1}
                    </span>
                    <input
                      value={obj}
                      onChange={(e) => updateObjective(idx, e.target.value)}
                      className="ce-field flex-1"
                      placeholder="Ej. Entender los conceptos básicos de..."
                    />
                    {objectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeObjective(idx)}
                        className="px-3 text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Los objetivos ayudan a los estudiantes a entender qué aprenderán.
              </p>
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="ce-card p-5">
            <div className="text-sm font-semibold text-zinc-200 mb-4">Contenido del taller</div>
            <p className="text-sm text-zinc-400 mb-4">
              Agrega el material educativo: texto explicativo, videos de YouTube e imágenes.
            </p>
            <ContentBlockEditor
              blocks={content}
              onChange={setContent}
              disabled={loading}
            />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="ce-card p-5">
            <div className="text-sm font-semibold text-zinc-200 mb-4">Configuración de acceso</div>
            
            <div>
              <label className="text-sm font-medium text-zinc-300">Visibilidad</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as WorkshopVisibility)}
                className="ce-field mt-1"
              >
                <option value="internal">Interno - Visible para todos los estudiantes de la escuela</option>
                <option value="code">Por código - Solo accesible con código de acceso</option>
              </select>
            </div>

            {visibility === 'code' && (
              <div className="mt-4">
                <label className="text-sm font-medium text-zinc-300">Código de acceso *</label>
                <input
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="ce-field mt-1"
                  placeholder="Ej. CYBER2024"
                  required
                  minLength={3}
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Los estudiantes necesitarán este código para acceder al taller.
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.replace('/talleres')}
            className="ce-btn ce-btn-ghost"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="ce-btn ce-btn-primary"
            disabled={loading}
          >
            {loading ? 'Creando…' : 'Crear taller'}
          </button>
        </div>
      </form>
    </div>
  );
}
