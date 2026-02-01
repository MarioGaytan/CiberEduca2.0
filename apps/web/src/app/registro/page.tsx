'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, email: email || undefined, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = (await res.json()) as any;
      setError(data?.message ?? 'No se pudo crear la cuenta.');
      return;
    }

    router.replace('/home');
  }

  return (
    <div className="ce-public-shell ce-public-bg">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-6">
          <div className="ce-chip">Registro</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Crear cuenta</h1>
          <p className="mt-2 text-sm text-zinc-300">Solo toma un minuto.</p>
        </div>

        <form onSubmit={onSubmit} className="ce-card p-6">
          <label className="block text-sm font-medium text-zinc-200">Usuario</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="ce-field"
            placeholder="tu_usuario"
            autoComplete="username"
            required
          />

          <label className="mt-4 block text-sm font-medium text-zinc-200">Correo escolar (opcional)</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="ce-field"
            placeholder="alumno@escuela.edu"
            autoComplete="email"
          />
          <p className="mt-1 text-xs text-zinc-400">Solo necesario si tu escuela lo requiere para identificarte.</p>

          <label className="mt-4 block text-sm font-medium text-zinc-200">Contraseña</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="ce-field"
            placeholder="••••••••"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="mt-1 text-xs text-zinc-400">Mínimo 8 caracteres. Usa letras y números para mayor seguridad.</p>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            disabled={loading}
            className="ce-btn ce-btn-primary mt-6 w-full py-3"
            type="submit"
          >
            {loading ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-300">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold text-fuchsia-300 hover:text-fuchsia-200">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
