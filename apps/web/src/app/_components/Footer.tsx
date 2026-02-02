'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-zinc-950/50 backdrop-blur-sm mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="text-lg font-semibold">
              <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
                CiberEduca
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              Plataforma educativa gamificada para estudiantes y maestros de secundaria.
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Legal</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/terminos"
                  className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidad"
                  className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Plataforma</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/login"
                  className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Iniciar Sesión
                </Link>
              </li>
              <li>
                <Link
                  href="/registro"
                  className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Crear Cuenta
                </Link>
              </li>
            </ul>
          </div>

          {/* Security Info */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Seguridad</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                Datos encriptados
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                Plataforma cerrada
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                Sin publicidad
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-zinc-500">
              © {currentYear} CiberEduca. Todos los derechos reservados.
            </p>
            <p className="text-xs text-zinc-500">
              Cumplimos con la Ley Federal de Protección de Datos Personales (LFPDPPP)
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
