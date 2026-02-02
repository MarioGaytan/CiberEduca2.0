'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type MeResponse =
  | { authenticated: true; user: { username: string; role: string } }
  | { authenticated: false };

type UserItem = {
  _id: string;
  username: string;
  email?: string;
  role: string;
  schoolId?: string;
  isActive?: boolean;
  createdAt?: string;
};

const ROLES = ['admin', 'reviewer', 'teacher', 'student', 'experience_manager'] as const;

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  reviewer: 'Revisor',
  teacher: 'Profesor',
  student: 'Estudiante',
  experience_manager: 'Gestor de Experiencia',
};

type CreateUserDraft = {
  username: string;
  email: string;
  password: string;
  role: (typeof ROLES)[number];
};

export default function AdminUsuariosPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState<CreateUserDraft>({
    username: '',
    email: '',
    password: '',
    role: 'student',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const role = useMemo(() => (me && me.authenticated ? me.user.role : ''), [me]);

  // Filter users based on search and role filter
  const filteredUsers = useMemo(() => {
    let list = users;
    
    if (roleFilter !== 'all') {
      list = list.filter(u => u.role === roleFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      list = list.filter(u => 
        u.username.toLowerCase().includes(query) ||
        (u.email && u.email.toLowerCase().includes(query))
      );
    }
    
    return list;
  }, [users, searchQuery, roleFilter]);

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

    const res = await fetch('/api/admin/users', { cache: 'no-store' });
    const data = (await res.json().catch(() => undefined)) as any;
    if (!res.ok) {
      setError((data && (data.message || data.error)) || 'No se pudieron cargar los usuarios.');
      setLoading(false);
      return;
    }

    setUsers(Array.isArray(data) ? (data as UserItem[]) : []);
    setLoading(false);
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (role !== 'admin') {
      setError('No tienes permisos para administrar usuarios.');
      return;
    }

    if (!draft.username.trim() || draft.username.trim().length < 3) {
      setError('El username debe tener al menos 3 caracteres.');
      return;
    }

    if (draft.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setSaving(true);

    const payload: any = {
      username: draft.username.trim(),
      password: draft.password,
      role: draft.role,
    };

    if (draft.email.trim()) payload.email = draft.email.trim();

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => undefined)) as any;

    if (!res.ok) {
      setError((data && (data.message || data.error)) || 'No se pudo crear el usuario.');
      setSaving(false);
      return;
    }

    setDraft({ username: '', email: '', password: '', role: 'student' });
    setSuccess('Usuario creado.');
    setSaving(false);
    await loadAll();
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="ce-chip">Admin</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Usuarios</h1>
          <p className="mt-2 text-sm text-zinc-400">Crear y listar usuarios por rol.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/experiencia"
            className="ce-btn ce-btn-ghost"
          >
            Gamificación
          </Link>
          <Link
            href="/admin/revision"
            className="ce-btn ce-btn-ghost"
          >
            Revisión
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 ce-card p-6 text-sm text-zinc-300">Cargando…</div>
      ) : !me || !me.authenticated ? (
        <div className="mt-8 ce-card p-6 text-sm text-zinc-300">No autenticado.</div>
      ) : role !== 'admin' ? (
        <div className="mt-8 ce-card p-6 text-sm text-zinc-300">No tienes permisos.</div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="ce-card p-5">
            <div className="text-sm font-semibold text-zinc-200">Crear usuario</div>
            <form onSubmit={onCreate} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-200">Username</label>
                <input
                  value={draft.username}
                  onChange={(e) => setDraft((p) => ({ ...p, username: e.target.value }))}
                  className="ce-field"
                  minLength={3}
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-200">Email (opcional)</label>
                <input
                  value={draft.email}
                  onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))}
                  className="ce-field"
                  type="email"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-200">Rol</label>
                <select
                  value={draft.role}
                  onChange={(e) => setDraft((p) => ({ ...p, role: e.target.value as any }))}
                  className="ce-field"
                  disabled={saving}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r] || r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-200">Contraseña</label>
                <input
                  value={draft.password}
                  onChange={(e) => setDraft((p) => ({ ...p, password: e.target.value }))}
                  className="ce-field"
                  type="password"
                  minLength={8}
                  required
                  disabled={saving}
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
              ) : null}

              {success ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                  {success}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="ce-btn ce-btn-primary w-full py-3"
              >
                {saving ? 'Creando…' : 'Crear usuario'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 ce-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-zinc-200">Listado</div>
                <div className="mt-1 text-sm text-zinc-400">
                  Mostrando {filteredUsers.length} de {users.length} usuarios
                </div>
              </div>
              <button
                type="button"
                onClick={loadAll}
                className="ce-btn ce-btn-ghost"
              >
                Recargar
              </button>
            </div>

            {/* Search and filter controls */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o email..."
                  className="ce-field mt-0 w-full"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="ce-field mt-0 w-auto min-w-[160px]"
              >
                <option value="all">Todos los roles</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r] || r}
                  </option>
                ))}
              </select>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="mt-4 text-sm text-zinc-400">
                {users.length === 0 ? 'No hay usuarios.' : 'No se encontraron usuarios con esos filtros.'}
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-12 gap-2 border-b border-white/10 bg-black/20 px-4 py-3 text-xs font-semibold text-zinc-300">
                  <div className="col-span-4">Username</div>
                  <div className="col-span-4">Email</div>
                  <div className="col-span-2">Rol</div>
                  <div className="col-span-2">School</div>
                </div>
                {filteredUsers.map((u) => (
                  <div key={u._id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm text-zinc-200 hover:bg-white/5 transition-colors">
                    <div className="col-span-4 font-semibold text-zinc-100">{u.username}</div>
                    <div className="col-span-4 text-zinc-300">{u.email || '—'}</div>
                    <div className="col-span-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'admin' ? 'bg-red-500/20 text-red-300' :
                        u.role === 'teacher' ? 'bg-blue-500/20 text-blue-300' :
                        u.role === 'reviewer' ? 'bg-amber-500/20 text-amber-300' :
                        u.role === 'experience_manager' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-zinc-500/20 text-zinc-300'
                      }`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </div>
                    <div className="col-span-2 text-zinc-400">{u.schoolId || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
