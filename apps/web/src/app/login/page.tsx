'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = (await res.json()) as any;
      setError(data?.message ?? 'No se pudo iniciar sesión.');
      return;
    }

    router.replace('/home');
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">CiberEduca</h1>
          <p className="mt-2 text-sm text-zinc-300">Inicia sesión para continuar.</p>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow">
          <label className="block text-sm font-medium text-zinc-200">Usuario o correo</label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="usuario o correo@escuela.edu"
            autoComplete="username"
            required
          />

          <label className="mt-4 block text-sm font-medium text-zinc-200">Contraseña</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="••••••••"
            type="password"
            autoComplete="current-password"
            required
          />

          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
            type="submit"
          >
            {loading ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-300">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="font-semibold text-indigo-300 hover:text-indigo-200">
            Crear cuenta
          </Link>
        </div>

        <div className="mt-4 text-center text-xs text-zinc-500">
          Recomendación: usa el correo escolar si tu secundaria lo solicita.
        </div>
      </div>
    </div>
  );
}
