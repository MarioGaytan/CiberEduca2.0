'use client';

import { useState, useEffect, useRef } from 'react';

type Collaborator = {
  userId: string;
  username?: string;
  role: 'editor' | 'viewer';
};

type TeacherOption = {
  _id: string;
  username: string;
  role: string;
};

type Props = {
  workshopId: string;
  collaborators: Collaborator[];
  onUpdate: () => void;
  canManage: boolean;
};

export default function CollaboratorManager({ workshopId, collaborators, onUpdate, canManage }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<TeacherOption | null>(null);
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<TeacherOption[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Search teachers as user types
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (!searchQuery.trim() || selectedUser) {
      setSuggestions([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/teachers?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          // Filter out already added collaborators
          const existingIds = collaborators.map(c => c.userId);
          setSuggestions(data.filter((t: TeacherOption) => !existingIds.includes(t._id)));
          setShowSuggestions(true);
        }
      } catch {
        // ignore
      }
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery, selectedUser, collaborators]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectUser(user: TeacherOption) {
    setSelectedUser(user);
    setSearchQuery(user.username);
    setShowSuggestions(false);
  }

  async function handleAdd() {
    if (!selectedUser) {
      setError('Selecciona un usuario de la lista');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/workshops/${workshopId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser._id, role }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Error al agregar colaborador');
        setLoading(false);
        return;
      }

      setSearchQuery('');
      setSelectedUser(null);
      setShowAdd(false);
      onUpdate();
    } catch {
      setError('Error de conexión');
    }
    setLoading(false);
  }

  async function handleRemove(userId: string) {
    if (!confirm('¿Eliminar este colaborador?')) return;
    
    try {
      await fetch(`/api/workshops/${workshopId}/collaborators/${userId}`, {
        method: 'DELETE',
      });
      onUpdate();
    } catch {
      // ignore
    }
  }

  return (
    <div className="ce-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-200">👥 Colaboradores</div>
        {canManage && !showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="text-xs text-fuchsia-300 hover:text-fuchsia-200"
          >
            + Agregar
          </button>
        )}
      </div>

      {collaborators.length === 0 && !showAdd ? (
        <div className="mt-2 text-xs text-zinc-500">Sin colaboradores</div>
      ) : (
        <div className="mt-3 space-y-2">
          {collaborators.map((c) => (
            <div key={c.userId} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-fuchsia-500/20 text-xs font-bold text-fuchsia-300">
                  {(c.username || 'U')[0].toUpperCase()}
                </div>
                <span className="text-sm text-zinc-200">{c.username || c.userId}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  c.role === 'editor' ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'bg-zinc-500/20 text-zinc-400'
                }`}>
                  {c.role === 'editor' ? 'Editor' : 'Visor'}
                </span>
              </div>
              {canManage && (
                <button
                  onClick={() => handleRemove(c.userId)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3" ref={wrapperRef}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedUser(null);
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Buscar maestro..."
                className="ce-field mt-0 w-full"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-white/10 bg-zinc-900 shadow-lg">
                  {suggestions.map((user) => (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => selectUser(user)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/5"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-fuchsia-500/20 text-xs font-bold text-fuchsia-300">
                        {user.username[0].toUpperCase()}
                      </div>
                      <span className="text-zinc-200">{user.username}</span>
                      <span className="ml-auto text-xs text-zinc-500">{user.role}</span>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery && !selectedUser && suggestions.length === 0 && (
                <div className="mt-1 text-xs text-zinc-500">Escribe para buscar maestros...</div>
              )}
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
              className="ce-field mt-0 w-auto"
            >
              <option value="viewer">Visor</option>
              <option value="editor">Editor</option>
            </select>
          </div>
          {selectedUser && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-fuchsia-500/10 px-3 py-2">
              <span className="text-xs text-zinc-400">Seleccionado:</span>
              <span className="text-sm font-medium text-fuchsia-300">{selectedUser.username}</span>
              <button
                type="button"
                onClick={() => { setSelectedUser(null); setSearchQuery(''); }}
                className="ml-auto text-xs text-zinc-400 hover:text-zinc-200"
              >
                ✕
              </button>
            </div>
          )}
          {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleAdd}
              disabled={loading || !selectedUser}
              className="ce-btn ce-btn-primary text-xs disabled:opacity-50"
            >
              {loading ? 'Agregando...' : 'Agregar'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setError(null); setSearchQuery(''); setSelectedUser(null); }}
              className="ce-btn ce-btn-ghost text-xs"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
