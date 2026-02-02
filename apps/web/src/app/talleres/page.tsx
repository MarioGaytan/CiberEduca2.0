'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Workshop = {
  _id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  estimatedMinutes?: number;
  objectives?: string[];
  status: 'draft' | 'in_review' | 'approved';
  visibility: 'internal' | 'code';
  createdAt?: string;
};

type MeResponse =
  | { authenticated: true; user: { username: string; role: string } }
  | { authenticated: false };

export default function TalleresPage() {
  const searchParams = useSearchParams();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'in_review' | 'approved'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const role = useMemo(() => (me && me.authenticated ? me.user.role : ''), [me]);

  const q = (searchParams?.get('q') ?? '').trim().toLowerCase();
  const searchTerm = localSearch.trim().toLowerCase() || q;
  const filtered = useMemo(() => {
    let list = workshops;
    
    // Students only see approved workshops
    if (role === 'student') {
      list = list.filter((w) => w.status === 'approved');
    } else if (statusFilter !== 'all') {
      // Staff can filter by status
      list = list.filter((w) => w.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      list = list.filter((w) => {
        const haystack = `${w.title ?? ''} ${w.description ?? ''}`.toLowerCase();
        return haystack.includes(searchTerm);
      });
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'oldest') return (a.createdAt || '').localeCompare(b.createdAt || '');
      // newest (default)
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    
    return list;
  }, [searchTerm, workshops, role, statusFilter, sortBy]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
      const meData = (await meRes.json()) as MeResponse;
      if (!alive) return;
      setMe(meData);
      if (!meRes.ok || !meData.authenticated) {
        setLoading(false);
        return;
      }

      const wsRes = await fetch('/api/workshops', { cache: 'no-store' });
      const wsData = (await wsRes.json()) as Workshop[];
      if (!alive) return;
      setWorkshops(Array.isArray(wsData) ? wsData : []);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Talleres</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {role === 'student' ? 'Talleres disponibles para ti.' : 'Gestiona tus talleres.'}
          </p>
        </div>
        <div className="flex gap-3">
          {(role === 'teacher' || role === 'admin') && (
            <Link
              href="/talleres/nuevo"
              className="ce-btn ce-btn-primary"
            >
              + Crear taller
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="ce-field mt-0 w-full"
          />
        </div>
        <div className="flex gap-2">
          {(role === 'teacher' || role === 'admin' || role === 'reviewer') && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="ce-field mt-0 w-auto min-w-[140px] cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="in_review">En revisión</option>
              <option value="approved">Aprobado</option>
            </select>
          )}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="ce-field mt-0 w-auto min-w-[120px] cursor-pointer"
          >
            <option value="newest">Más reciente</option>
            <option value="oldest">Más antiguo</option>
            <option value="name">Por nombre</option>
          </select>
        </div>
      </div>

        {loading ? (
          <div className="mt-8 ce-card p-6 text-sm text-zinc-300">Cargando…</div>
        ) : !me || !me.authenticated ? (
          <div className="mt-8 ce-card p-6 text-sm text-zinc-300">No autenticado. Inicia sesión para ver talleres.</div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 ce-card p-6 text-sm text-zinc-300">No hay talleres para mostrar.</div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((w) => (
              <Link
                key={w._id}
                href={`/talleres/${w._id}`}
                className="ce-card ce-card-hover block overflow-hidden"
              >
                {/* Cover image */}
                {w.coverImageUrl ? (
                  <div className="h-32 w-full overflow-hidden bg-zinc-900">
                    <img
                      src={w.coverImageUrl}
                      alt={w.title}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-fuchsia-900/30 to-purple-900/30">
                    <span className="text-4xl">📚</span>
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold text-zinc-100 line-clamp-1">{w.title}</div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      w.status === 'approved' 
                        ? 'bg-green-500/20 text-green-300' 
                        : w.status === 'in_review'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-zinc-500/20 text-zinc-300'
                    }`}>
                      {w.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {w.description && (
                    <div className="mt-2 text-xs text-zinc-400 line-clamp-2">{w.description}</div>
                  )}
                  
                  <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
                    {w.estimatedMinutes && (
                      <span className="flex items-center gap-1">
                        <span>⏱️</span>
                        <span>{w.estimatedMinutes} min</span>
                      </span>
                    )}
                    {w.objectives && w.objectives.length > 0 && (
                      <span className="flex items-center gap-1">
                        <span>🎯</span>
                        <span>{w.objectives.length} objetivos</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      {w.visibility === 'internal' ? '🔓' : '🔐'}
                      <span className="capitalize">{w.visibility}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}
