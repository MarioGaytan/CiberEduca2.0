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
      const data = (await res.json().catch(() => undefined)) as any;
      const fallback = 'No se pudo iniciar sesión.';
      setError((data && (data.message || data.error)) || fallback);
      return;
    }

    router.replace('/home');
  }

  return (
    <div className="ce-public-shell ce-public-bg">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-6">
          <div className="ce-chip">Acceso</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            <span className="ce-title-gradient">CiberEduca</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-300">Inicia sesión para continuar.</p>
        </div>

        <form onSubmit={onSubmit} className="ce-card p-6">
          <label className="block text-sm font-medium text-zinc-200">Usuario o correo</label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="ce-field"
            placeholder="usuario o correo@escuela.edu"
            autoComplete="username"
            required
          />

          <label className="mt-4 block text-sm font-medium text-zinc-200">Contraseña</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="ce-field"
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
            className="ce-btn ce-btn-primary mt-6 w-full py-3"
            type="submit"
          >
            {loading ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-300">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="font-semibold text-fuchsia-300 hover:text-fuchsia-200">
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
