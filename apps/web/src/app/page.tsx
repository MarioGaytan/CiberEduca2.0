'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type AuthState = 
  | { status: 'loading' }
  | { status: 'guest' }
  | { status: 'authenticated'; role: string; username: string };

export default function LandingPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setAuth({ status: 'authenticated', role: data.user.role, username: data.user.username });
        } else {
          setAuth({ status: 'guest' });
        }
      })
      .catch(() => setAuth({ status: 'guest' }));
  }, []);

  const handleGoToApp = () => {
    if (auth.status === 'authenticated') {
      const role = auth.role;
      if (role === 'teacher' || role === 'admin' || role === 'reviewer') {
        router.push('/dashboard');
      } else {
        router.push('/home');
      }
    }
  };

  return (
    <div className="ce-public-shell ce-public-bg">
      <div className="relative mx-auto w-full max-w-6xl px-6 py-14">
        {/* Hero Section */}
        <div className="flex min-h-[60vh] flex-col justify-center">
          <div className="max-w-2xl">
            <div className="ce-chip">🎓 Plataforma educativa gamificada</div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
              <span className="ce-title-gradient">CiberEduca</span>
            </h1>
            <p className="mt-4 text-base leading-7 text-zinc-300 sm:text-lg">
              Aprende, compite y gana recompensas mientras completas talleres y tests.
              <br />
              <span className="text-zinc-400">Diseñado para estudiantes y maestros de secundaria.</span>
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {auth.status === 'loading' ? (
                <div className="text-zinc-400 py-3">Cargando...</div>
              ) : auth.status === 'authenticated' ? (
                <>
                  <button onClick={handleGoToApp} className="ce-btn ce-btn-primary px-6 py-3">
                    Ir a la plataforma
                  </button>
                  <span className="flex items-center text-sm text-zinc-400">
                    Conectado como <span className="ml-1 font-semibold text-fuchsia-300">{auth.username}</span>
                  </span>
                </>
              ) : (
                <>
                  <Link href="/login" className="ce-btn ce-btn-primary px-6 py-3">
                    Iniciar sesión
                  </Link>
                  <Link href="/registro" className="ce-btn ce-btn-ghost px-6 py-3">
                    Crear cuenta de alumno
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-zinc-100">¿Cómo funciona?</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="ce-card ce-card-hover p-5">
              <div className="text-2xl">📚</div>
              <div className="mt-3 text-sm font-semibold text-zinc-200">Talleres</div>
              <div className="mt-2 text-sm text-zinc-400">
                Contenido educativo con videos, imágenes y texto. Algunos requieren código de acceso.
              </div>
            </div>
            <div className="ce-card ce-card-hover p-5">
              <div className="text-2xl">📝</div>
              <div className="mt-3 text-sm font-semibold text-zinc-200">Tests</div>
              <div className="mt-2 text-sm text-zinc-400">
                Preguntas de opción múltiple y abiertas. Con pistas y explicaciones después de responder.
              </div>
            </div>
            <div className="ce-card ce-card-hover p-5">
              <div className="text-2xl">⭐</div>
              <div className="mt-3 text-sm font-semibold text-zinc-200">Experiencia (XP)</div>
              <div className="mt-2 text-sm text-zinc-400">
                Gana XP al completar tests. Sube de nivel y desbloquea avatares, colores y marcos.
              </div>
            </div>
            <div className="ce-card ce-card-hover p-5">
              <div className="text-2xl">🏆</div>
              <div className="mt-3 text-sm font-semibold text-zinc-200">Ranking</div>
              <div className="mt-2 text-sm text-zinc-400">
                Compite con tus compañeros. Los mejores reciben medallas especiales.
              </div>
            </div>
          </div>
        </div>

        {/* XP System Preview */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-zinc-100">Sistema de Recompensas</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="ce-card p-6">
              <h3 className="text-lg font-semibold text-fuchsia-300">🎨 Personaliza tu Avatar</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Desbloquea estilos, colores, accesorios y marcos exclusivos a medida que ganas experiencia.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-zinc-700 px-3 py-1 text-xs text-zinc-300">Base Cool - 100 XP</span>
                <span className="rounded-full bg-zinc-700 px-3 py-1 text-xs text-zinc-300">Corona - 1000 XP</span>
                <span className="rounded-full bg-zinc-700 px-3 py-1 text-xs text-zinc-300">Marco Oro - 1000 XP</span>
                <span className="rounded-full bg-zinc-700 px-3 py-1 text-xs text-zinc-300">Legendario - 5000 XP</span>
              </div>
            </div>
            <div className="ce-card p-6">
              <h3 className="text-lg font-semibold text-amber-300">🏅 Gana Medallas</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Obtén medallas por logros especiales y posiciones en el ranking.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs text-amber-300">🥇 Primer Lugar</span>
                <span className="rounded-full bg-zinc-500/20 px-3 py-1 text-xs text-zinc-300">🥈 Top 3</span>
                <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-300">🥉 Top 10</span>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">✅ Primer Test</span>
              </div>
            </div>
          </div>
        </div>

        {/* For Teachers */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-zinc-100">Para Maestros</h2>
          <div className="mt-6 ce-card p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <div className="text-xl">✏️</div>
                <h3 className="mt-2 font-semibold text-zinc-200">Crea Contenido</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Diseña talleres con videos de YouTube, imágenes y bloques de texto enriquecido.
                </p>
              </div>
              <div>
                <div className="text-xl">👥</div>
                <h3 className="mt-2 font-semibold text-zinc-200">Colabora</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Invita a otros maestros como colaboradores para crear contenido juntos.
                </p>
              </div>
              <div>
                <div className="text-xl">📊</div>
                <h3 className="mt-2 font-semibold text-zinc-200">Califica</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Revisa las respuestas de tus alumnos y califica preguntas abiertas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        {auth.status === 'guest' && (
          <div className="mt-16 mb-8 text-center">
            <p className="text-zinc-400">¿Listo para empezar?</p>
            <div className="mt-4 flex justify-center gap-4">
              <Link href="/registro" className="ce-btn ce-btn-primary px-8 py-3">
                Crear cuenta gratis
              </Link>
            </div>
          </div>
        )}
        {auth.status === 'authenticated' && (
          <div className="mt-16 mb-8 text-center">
            <p className="text-zinc-400">Ya tienes una cuenta activa</p>
            <div className="mt-4 flex justify-center gap-4">
              <button onClick={handleGoToApp} className="ce-btn ce-btn-primary px-8 py-3">
                Continuar a la plataforma
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
