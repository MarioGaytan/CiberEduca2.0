'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type MeResponse =
  | { authenticated: true; user: { username: string; role: string } }
  | { authenticated: false };

type NavItem = {
  href: string;
  label: string;
  visible: (role: string) => boolean;
};

const PUBLIC_ROUTES = new Set(['/', '/login', '/registro']);

const NAV: NavItem[] = [
  { href: '/home', label: 'Inicio', visible: () => true },
  { href: '/talleres', label: 'Talleres', visible: () => true },
  { href: '/intentos', label: 'Intentos', visible: (r) => r === 'teacher' || r === 'admin' },
  { href: '/admin/revision', label: 'Revisión', visible: (r) => r === 'admin' || r === 'reviewer' },
  { href: '/admin/usuarios', label: 'Usuarios', visible: (r) => r === 'admin' },
  { href: '/dashboard', label: 'Dashboard', visible: () => true },
  { href: '/perfil', label: 'Perfil', visible: () => true },
];

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isPublic = useMemo(() => {
    if (!pathname) return true;
    return PUBLIC_ROUTES.has(pathname);
  }, [pathname]);

  const role = useMemo(() => {
    if (!me || !me.authenticated) return '';
    return me.user.role;
  }, [me]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (isPublic) {
        if (alive) {
          setMe(null);
          setLoading(false);
        }
        return;
      }

      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = (await res.json()) as MeResponse;

      if (!alive) return;

      if (!res.ok || !data.authenticated) {
        router.replace('/login');
        return;
      }

      setMe(data);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [isPublic, router]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  const navItems = useMemo(() => NAV.filter((i) => i.visible(role)), [role]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (loading || !me || !me.authenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-500 blur-3xl" />
            <div className="absolute top-24 left-10 h-72 w-72 rounded-full bg-cyan-400 blur-3xl" />
            <div className="absolute top-40 right-10 h-72 w-72 rounded-full bg-indigo-500 blur-3xl" />
          </div>
          <div className="mx-auto w-full max-w-5xl px-6 py-10">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">Cargando…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-35">
        <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-500 blur-3xl" />
        <div className="absolute top-32 left-10 h-72 w-72 rounded-full bg-cyan-400 blur-3xl" />
        <div className="absolute top-52 right-10 h-72 w-72 rounded-full bg-indigo-500 blur-3xl" />
      </div>

      <div className="relative">
        <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/10 bg-zinc-950/70 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen((s) => !s)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/10 lg:hidden"
                type="button"
              >
                Menú
              </button>
              <Link href="/home" className="font-semibold tracking-tight">
                <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
                  CiberEduca
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-xs text-zinc-300 sm:block">
                <span className="font-semibold text-zinc-100">{me.user.username}</span>
                <span className="mx-2 text-zinc-600">|</span>
                <span className="capitalize">{me.user.role}</span>
              </div>
              <button
                onClick={logout}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/10"
                type="button"
              >
                Salir
              </button>
            </div>
          </div>
        </header>

        <aside
          className={
            sidebarOpen
              ? 'fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-zinc-950/90 backdrop-blur lg:hidden'
              : 'hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-72 lg:border-r lg:border-white/10 lg:bg-zinc-950/70 lg:backdrop-blur'
          }
        >
          <div className="flex h-14 items-center justify-between px-4">
            <div className="text-sm font-semibold text-zinc-100">Navegación</div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/10 lg:hidden"
              type="button"
            >
              Cerrar
            </button>
          </div>

          <nav className="px-3 py-3">
            <div className="space-y-1">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={
                      active
                        ? 'block rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-zinc-100'
                        : 'block rounded-xl border border-transparent px-4 py-3 text-sm font-semibold text-zinc-200 hover:border-white/10 hover:bg-white/5'
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs font-semibold text-zinc-200">Acceso rápido</div>
              <div className="mt-3 space-y-2">
                <Link
                  href="/talleres"
                  onClick={() => setSidebarOpen(false)}
                  className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-zinc-100 hover:bg-black/30"
                >
                  Ver talleres
                </Link>
                {(role === 'teacher' || role === 'admin') && (
                  <Link
                    href="/intentos"
                    onClick={() => setSidebarOpen(false)}
                    className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-zinc-100 hover:bg-black/30"
                  >
                    Bandeja de intentos
                  </Link>
                )}
              </div>
            </div>
          </nav>
        </aside>

        <main className="pt-14 lg:pl-72">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
