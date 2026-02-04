'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import Footer from '../_components/Footer';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          const role = data.user?.role;
          if (role === 'teacher' || role === 'admin' || role === 'reviewer') {
            router.replace('/dashboard');
          } else {
            router.replace('/home');
          }
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  const passwordsMatch = password === confirmPassword;
  const passwordValid = password.length >= 8;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!passwordValid) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones para continuar.');
      return;
    }

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

  if (checking) {
    return (
      <div className="ce-public-shell ce-public-bg">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-zinc-400">Verificando sesión...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ce-public-shell ce-public-bg min-h-screen flex flex-col">
      <div className="relative flex-1 mx-auto flex w-full max-w-md flex-col justify-center px-6 py-10">
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
            className={"ce-field " + (password && !passwordValid ? 'border-red-500/50' : '')}
            placeholder="••••••••"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="mt-1 text-xs text-zinc-400">Mínimo 8 caracteres. Usa letras y números para mayor seguridad.</p>

          <label className="mt-4 block text-sm font-medium text-zinc-200">Confirmar contraseña</label>
          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={"ce-field " + (confirmPassword && !passwordsMatch ? 'border-red-500/50' : confirmPassword && passwordsMatch ? 'border-green-500/50' : '')}
            placeholder="••••••••"
            type="password"
            autoComplete="new-password"
            required
          />
          {confirmPassword && !passwordsMatch && (
            <p className="mt-1 text-xs text-red-400">Las contraseñas no coinciden.</p>
          )}
          {confirmPassword && passwordsMatch && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-green-400">
              <Check className="h-3.5 w-3.5" />
              Las contraseñas coinciden.
            </p>
          )}

          {/* Checkbox de Términos y Condiciones */}
          <div className="mt-6 p-4 rounded-xl bg-black/20 border border-white/10">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30 text-fuchsia-500 focus:ring-fuchsia-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-sm text-zinc-300">
                He leído y acepto los{' '}
                <Link
                  href="/terminos"
                  target="_blank"
                  className="text-fuchsia-300 hover:text-fuchsia-200 underline"
                >
                  Términos y Condiciones
                </Link>
                {' '}y la{' '}
                <Link
                  href="/privacidad"
                  target="_blank"
                  className="text-fuchsia-300 hover:text-fuchsia-200 underline"
                >
                  Política de Privacidad
                </Link>
                .
              </span>
            </label>
            <p className="mt-2 text-xs text-zinc-500 ml-7">
              Si eres menor de edad, confirmas que tu padre, madre o tutor legal ha autorizado tu registro.
            </p>
          </div>

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
      <Footer />
    </div>
  );
}
