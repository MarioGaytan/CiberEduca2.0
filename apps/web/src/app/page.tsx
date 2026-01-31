import Link from 'next/link';

export default function Home() {
  return (
    <div className="ce-public-shell ce-public-bg">
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-14">
        <div className="max-w-2xl">
          <div className="ce-chip">Plataforma escolar</div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            <span className="ce-title-gradient">CiberEduca</span>
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-300 sm:text-lg">
            Talleres, tests y aprendizaje interactivo. Diseñado para usarse desde celular o computadora.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="ce-btn ce-btn-primary px-5 py-3"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="ce-btn ce-btn-ghost px-5 py-3"
            >
              Crear cuenta
            </Link>
            <Link
              href="/home"
              className="ce-btn ce-btn-soft px-5 py-3 text-zinc-200"
            >
              Ir al inicio
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="ce-card ce-card-hover p-5">
              <div className="text-sm font-semibold text-zinc-200">Talleres</div>
              <div className="mt-2 text-sm text-zinc-400">Abiertos o por código, según el grupo.</div>
            </div>
            <div className="ce-card ce-card-hover p-5">
              <div className="text-sm font-semibold text-zinc-200">Tests</div>
              <div className="mt-2 text-sm text-zinc-400">Opción múltiple + preguntas abiertas.</div>
            </div>
            <div className="ce-card ce-card-hover p-5">
              <div className="text-sm font-semibold text-zinc-200">Puntaje</div>
              <div className="mt-2 text-sm text-zinc-400">Automático y con revisión del profesor.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
