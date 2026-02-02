'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import CollaboratorManager from '../../_components/workshop/CollaboratorManager';
import ContentBlockViewer, { ContentBlock } from '../../_components/workshop/ContentBlockViewer';

type Collaborator = {
  userId: string;
  username?: string;
  role: 'editor' | 'viewer';
};

type Workshop = {
  _id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  objectives?: string[];
  estimatedMinutes?: number;
  content?: ContentBlock[];
  status: 'draft' | 'in_review' | 'approved';
  visibility: 'internal' | 'code';
  reviewerFeedback?: string;
  createdByUsername?: string;
  approvedByUsername?: string;
  collaborators?: Collaborator[];
  editRequested?: boolean;
  deleteRequested?: boolean;
};

type TestItem = {
  _id: string;
  title: string;
  description?: string;
  status: 'draft' | 'in_review' | 'approved';
};

type MeResponse =
  | { authenticated: true; user: { username: string; role: string } }
  | { authenticated: false };

export default function TallerDetallePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [me, setMe] = useState<MeResponse | null>(null);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = useMemo(() => (me && me.authenticated ? me.user.role : ''), [me]);

  async function reloadAll() {
    setError(null);
    const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
    const meData = (await meRes.json()) as MeResponse;
    setMe(meData);

    if (!meRes.ok || !meData.authenticated) {
      setLoading(false);
      return;
    }

    const wsRes = await fetch(`/api/workshops/${id}`, { cache: 'no-store' });
    const wsData = (await wsRes.json().catch(() => undefined)) as any;
    if (!wsRes.ok) {
      setError((wsData && (wsData.message || wsData.error)) || 'No se pudo cargar el taller.');
      setLoading(false);
      return;
    }

    setWorkshop(wsData as Workshop);

    const testsRes = await fetch(`/api/tests/workshop/${id}`, { cache: 'no-store' });
    const testsData = (await testsRes.json().catch(() => undefined)) as any;
    if (testsRes.ok && Array.isArray(testsData)) {
      setTests(testsData as TestItem[]);
    } else {
      setTests([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void reloadAll();
  }, [id]);

  async function actionPost(path: string, body?: any) {
    setError(null);
    const res = await fetch(path, {
      method: 'POST',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json().catch(() => undefined)) as any;
    if (!res.ok) {
      setError((data && (data.message || data.error)) || 'No se pudo completar la acción.');
      return;
    }
    await reloadAll();
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/talleres" className="text-sm font-semibold text-fuchsia-300 hover:text-fuchsia-200">
            ← Volver a talleres
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{workshop?.title ?? 'Taller'}</h1>
          {workshop?.description ? (
            <p className="mt-2 text-sm text-zinc-300">{workshop.description}</p>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">Sin descripción</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.replace('/dashboard')}
            className="ce-btn ce-btn-ghost"
          >
            Dashboard
          </button>

          {workshop && (role === 'teacher' || role === 'admin') && workshop.status === 'draft' ? (
            <button
              onClick={() => actionPost(`/api/workshops/${id}/submit`)}
              className="ce-btn ce-btn-primary"
            >
              Enviar a revisión
            </button>
          ) : null}

          {workshop && (role === 'reviewer' || role === 'admin') && workshop.status === 'in_review' ? (
            <>
              <button
                onClick={() => actionPost(`/api/workshops/${id}/approve`, { feedback: 'Aprobado' })}
                className="ce-btn ce-btn-success"
              >
                Aprobar
              </button>
              <button
                onClick={() => actionPost(`/api/workshops/${id}/reject`, { feedback: 'Rechazado' })}
                className="ce-btn ce-btn-danger"
              >
                Rechazar
              </button>
            </>
          ) : null}

          {/* Request edit - for approved workshops */}
          {workshop && (role === 'teacher' || role === 'admin') && workshop.status === 'approved' && !workshop.editRequested ? (
            <button
              onClick={() => actionPost(`/api/workshops/${id}/request-edit`, { reason: 'Solicitud de edición' })}
              className="ce-btn ce-btn-soft"
            >
              ✏️ Solicitar edición
            </button>
          ) : null}

          {/* Request delete */}
          {workshop && (role === 'teacher' || role === 'admin') && !workshop.deleteRequested ? (
            <button
              onClick={() => {
                if (confirm('¿Estás seguro de que deseas solicitar la eliminación de este taller?')) {
                  actionPost(`/api/workshops/${id}/request-delete`, { reason: 'Solicitud de eliminación' });
                }
              }}
              className="ce-btn ce-btn-ghost text-red-400 hover:text-red-300"
            >
              🗑️ Solicitar eliminación
            </button>
          ) : null}

          {/* Approve pending requests - for admin/reviewer */}
          {workshop && (role === 'reviewer' || role === 'admin') && workshop.editRequested ? (
            <button
              onClick={() => actionPost(`/api/workshops/${id}/approve-edit`)}
              className="ce-btn ce-btn-primary"
            >
              ✅ Aprobar edición
            </button>
          ) : null}

          {workshop && (role === 'reviewer' || role === 'admin') && workshop.deleteRequested ? (
            <button
              onClick={() => {
                if (confirm('¿Confirmar eliminación permanente del taller?')) {
                  fetch(`/api/workshops/${id}`, { method: 'DELETE' })
                    .then(() => router.replace('/talleres'));
                }
              }}
              className="ce-btn ce-btn-danger"
            >
              🗑️ Confirmar eliminación
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="mt-8 ce-card p-6 text-sm text-zinc-300">Cargando…</div>
      ) : error ? (
        <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">{error}</div>
      ) : !me || !me.authenticated ? (
        <div className="mt-8 ce-card p-6 text-sm text-zinc-300">No autenticado.</div>
      ) : !workshop ? (
        <div className="mt-8 ce-card p-6 text-sm text-zinc-300">Taller no encontrado.</div>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Cover image */}
          {workshop.coverImageUrl && (
            <div className="overflow-hidden rounded-2xl">
              <img
                src={workshop.coverImageUrl}
                alt={workshop.title}
                className="w-full h-48 object-cover"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
          )}

          {/* Quick info cards - different for students vs staff */}
          {role === 'student' ? (
            // Student view: simplified info
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="ce-card p-4 text-center">
                <div className="text-2xl font-bold text-amber-300">
                  {workshop.estimatedMinutes ? `${workshop.estimatedMinutes}m` : '—'}
                </div>
                <div className="mt-1 text-xs text-zinc-400">Duración estimada</div>
              </div>
              <div className="ce-card p-4 text-center">
                <div className="text-2xl font-bold text-cyan-300">{tests.filter(t => t.status === 'approved').length}</div>
                <div className="mt-1 text-xs text-zinc-400">Tests disponibles</div>
              </div>
              <div className="ce-card p-4 text-center">
                <div className="text-lg font-bold text-fuchsia-300 truncate">
                  {workshop.createdByUsername || 'Profesor'}
                </div>
                <div className="mt-1 text-xs text-zinc-400">Creado por</div>
              </div>
            </div>
          ) : (
            // Staff view: full admin info
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="ce-card p-4 text-center">
                <div className={`text-2xl font-bold capitalize ${
                  workshop.status === 'approved' ? 'text-green-300' :
                  workshop.status === 'in_review' ? 'text-amber-300' : 'text-zinc-300'
                }`}>
                  {workshop.status.replace('_', ' ')}
                </div>
                <div className="mt-1 text-xs text-zinc-400">Estado</div>
              </div>
              <div className="ce-card p-4 text-center">
                <div className="text-2xl font-bold text-cyan-300">{tests.length}</div>
                <div className="mt-1 text-xs text-zinc-400">Tests</div>
              </div>
              <div className="ce-card p-4 text-center">
                <div className="text-2xl font-bold text-amber-300">
                  {workshop.estimatedMinutes ? `${workshop.estimatedMinutes}m` : '—'}
                </div>
                <div className="mt-1 text-xs text-zinc-400">Duración</div>
              </div>
              <div className="ce-card p-4 text-center">
                <div className="text-2xl font-bold text-green-300 capitalize">{workshop.visibility}</div>
                <div className="mt-1 text-xs text-zinc-400">Acceso</div>
              </div>
            </div>
          )}

          {/* Creator and collaborators - staff only */}
          {role !== 'student' && (
            <div className="ce-card p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Creado por:</span>
                  <span className="text-sm font-medium text-zinc-200">{workshop.createdByUsername || 'Desconocido'}</span>
                </div>
                {workshop.approvedByUsername && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Aprobado por:</span>
                    <span className="text-sm font-medium text-green-300">{workshop.approvedByUsername}</span>
                  </div>
                )}
                {workshop.collaborators && workshop.collaborators.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Colaboradores:</span>
                    <div className="flex flex-wrap gap-1">
                      {workshop.collaborators.map((c, idx) => (
                        <span key={idx} className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.role === 'editor' ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'bg-zinc-500/20 text-zinc-300'
                        }`}>
                          {c.username || c.userId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {(workshop.editRequested || workshop.deleteRequested) && (
                <div className="mt-3 flex gap-2">
                  {workshop.editRequested && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-300">
                      ✏️ Solicitud de edición pendiente
                    </span>
                  )}
                  {workshop.deleteRequested && (
                    <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-300">
                      🗑️ Solicitud de eliminación pendiente
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Collaborator manager - for staff (owner/admin) */}
          {role !== 'student' && (
            <CollaboratorManager
              workshopId={id}
              collaborators={workshop.collaborators || []}
              onUpdate={reloadAll}
              canManage={role === 'admin' || (me?.authenticated && me.user.username === workshop.createdByUsername)}
            />
          )}

          {/* Student: show collaborators read-only */}
          {role === 'student' && workshop.collaborators && workshop.collaborators.length > 0 && (
            <div className="ce-card p-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Colaboradores:</span>
                <div className="flex flex-wrap gap-1">
                  {workshop.collaborators.map((c, idx) => (
                    <span key={idx} className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-xs text-fuchsia-300">
                      {c.username || 'Colaborador'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reviewer feedback - staff only */}
          {role !== 'student' && workshop.reviewerFeedback && (
            <div className="ce-card p-4 border-l-4 border-amber-500">
              <div className="text-sm font-semibold text-amber-200">Feedback del revisor</div>
              <div className="mt-1 text-sm text-zinc-300">{workshop.reviewerFeedback}</div>
            </div>
          )}

          {/* Objectives */}
          {workshop.objectives && workshop.objectives.length > 0 && (
            <div className="ce-card p-5">
              <div className="text-sm font-semibold text-zinc-200 mb-3">🎯 Objetivos de aprendizaje</div>
              <ul className="space-y-2">
                {workshop.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/20 text-xs font-bold text-fuchsia-300">
                      {idx + 1}
                    </span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Content blocks - for students and staff */}
          {workshop.content && workshop.content.length > 0 && (
            <div className="ce-card p-5">
              <div className="text-sm font-semibold text-zinc-200 mb-4">📖 Contenido del taller</div>
              <ContentBlockViewer blocks={workshop.content} />
            </div>
          )}

          {/* Tests section */}
          <div className="ce-card p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-200">📝 Tests</div>
                <div className="mt-1 text-sm text-zinc-400">
                  {role === 'student' 
                    ? 'Completa los tests para ganar XP y avanzar.'
                    : 'Tests asociados a este taller.'}
                </div>
              </div>
              {role === 'teacher' || role === 'admin' ? (
                <Link href={`/talleres/${id}/tests/nuevo`} className="ce-btn ce-btn-primary">
                  Crear test
                </Link>
              ) : null}
            </div>

            {tests.length === 0 ? (
              <div className="mt-4 text-sm text-zinc-400">Aún no hay tests disponibles.</div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {tests.map((t) => (
                  <Link
                    key={t._id}
                    href={`/tests/${t._id}`}
                    className="ce-card ce-card-hover block rounded-xl bg-black/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-zinc-100">{t.title}</div>
                        {t.description && (
                          <div className="mt-1 text-sm text-zinc-400 line-clamp-2">{t.description}</div>
                        )}
                      </div>
                      {/* Status badge - hide for students */}
                      {role !== 'student' && (
                        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                          t.status === 'approved' 
                            ? 'bg-green-500/20 text-green-300' 
                            : t.status === 'in_review'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-zinc-500/20 text-zinc-300'
                        }`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
