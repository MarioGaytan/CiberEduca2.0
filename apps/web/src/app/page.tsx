import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-14">
        <div className="max-w-2xl">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200">
            Plataforma escolar
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            CiberEduca
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-300 sm:text-lg">
            Talleres, tests y aprendizaje interactivo. Diseñado para usarse desde celular o computadora.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100 hover:bg-white/10"
            >
              Crear cuenta
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-transparent px-5 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/5"
            >
              Ir al dashboard
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold text-zinc-200">Talleres</div>
              <div className="mt-2 text-sm text-zinc-400">Abiertos o por código, según el grupo.</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold text-zinc-200">Tests</div>
              <div className="mt-2 text-sm text-zinc-400">Opción múltiple + preguntas abiertas.</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold text-zinc-200">Puntaje</div>
              <div className="mt-2 text-sm text-zinc-400">Automático y con revisión del profesor.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
