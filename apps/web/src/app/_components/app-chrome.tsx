'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Home,
  Inbox,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';

type MeResponse =
  | { authenticated: true; user: { username: string; role: string } }
  | { authenticated: false };

type NavItem = {
  href: string;
  label: string;
  visible: (role: string) => boolean;
};

function navIcon(href: string) {
  if (href === '/home') return Home;
  if (href === '/talleres') return BookOpen;
  if (href === '/intentos') return Inbox;
  if (href === '/admin/revision') return ShieldCheck;
  if (href === '/admin/usuarios') return Users;
  if (href === '/dashboard') return LayoutDashboard;
  if (href === '/perfil') return User;
  return LayoutDashboard;
}

const PUBLIC_ROUTES = new Set(['/', '/login', '/registro']);

const NAV: NavItem[] = [
  // Students see "Inicio", staff see "Dashboard"
  { href: '/home', label: 'Inicio', visible: (r) => r === 'student' || r === '' },
  { href: '/dashboard', label: 'Dashboard', visible: (r) => r === 'teacher' || r === 'admin' || r === 'reviewer' },
  { href: '/talleres', label: 'Talleres', visible: () => true },
  { href: '/intentos', label: 'Intentos', visible: (r) => r === 'teacher' || r === 'admin' },
  { href: '/admin/revision', label: 'Revisión', visible: (r) => r === 'admin' || r === 'reviewer' },
  { href: '/admin/usuarios', label: 'Usuarios', visible: (r) => r === 'admin' },
  { href: '/perfil', label: 'Perfil', visible: () => true },
];

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [search, setSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const asideRef = useRef<HTMLElement | null>(null);
  const lastScrollYRef = useRef(0);
  const mainRef = useRef<HTMLElement | null>(null);

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

  useEffect(() => {
    setSidebarOpen(false);
    setMobileSearchOpen(false);
    try {
      mainRef.current?.scrollTo({ top: 0 });
    } catch {
      // ignore
    }
  }, [pathname]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    lastScrollYRef.current = el.scrollTop;
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const current = mainRef.current;
        if (!current) {
          ticking = false;
          return;
        }

        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          setHeaderHidden(false);
          lastScrollYRef.current = current.scrollTop;
          ticking = false;
          return;
        }

        const y = current.scrollTop;
        const lastY = lastScrollYRef.current;
        const dy = y - lastY;

        if (y < 24) {
          setHeaderHidden(false);
        } else {
          if (dy > 0 && y > 96) setHeaderHidden(true);
          if (dy < 0) setHeaderHidden(false);
        }

        lastScrollYRef.current = y;
        ticking = false;
      });
    }

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  function goSearchTalleres() {
    const q = search.trim();
    if (!q) {
      router.push('/talleres');
      return;
    }
    router.push(`/talleres?q=${encodeURIComponent(q)}`);
  }

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('ce.sidebarCollapsed');
      if (raw === '1') setSidebarCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('ce.sidebarCollapsed', sidebarCollapsed ? '1' : '0');
    } catch {
      // ignore
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (sidebarCollapsed) return;
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 1024) return;

      const el = asideRef.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (target && el.contains(target)) return;

      setSidebarCollapsed(true);
    }

    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [sidebarCollapsed]);

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
      <div className="min-h-screen text-zinc-50">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-500 blur-3xl" />
            <div className="absolute top-24 left-10 h-72 w-72 rounded-full bg-cyan-400 blur-3xl" />
            <div className="absolute top-40 right-10 h-72 w-72 rounded-full bg-indigo-500 blur-3xl" />
          </div>
          <div className="mx-auto w-full max-w-5xl px-6 py-10">
            <div className="ce-card p-6 text-sm text-zinc-300">Cargando…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-zinc-50">
      {/* Background gradients - fixed so they don't scroll */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-35 -z-10">
        <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-500 blur-3xl" />
        <div className="absolute top-32 left-10 h-72 w-72 rounded-full bg-cyan-400 blur-3xl" />
        <div className="absolute top-52 right-10 h-72 w-72 rounded-full bg-indigo-500 blur-3xl" />
      </div>

      {/* Layout container */}
      <div className="flex min-h-screen">
        <header
          className={
            'fixed top-0 right-0 z-40 border-b border-white/10 bg-zinc-950/65 backdrop-blur transition-transform duration-200 ' +
            (headerHidden ? '-translate-y-full' : 'translate-y-0') +
            ' left-0 ' +
            (sidebarCollapsed ? 'lg:left-20' : 'lg:left-72')
          }
        >
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen((s) => !s)}
                className="ce-btn ce-btn-ghost px-3 py-2 text-xs lg:hidden"
                type="button"
              >
                Menú
              </button>
              <Link href="/home" className="font-semibold tracking-tight">
                <span className="ce-title-gradient text-base sm:text-lg">CiberEduca</span>
              </Link>
            </div>

            <div className="hidden flex-1 lg:block">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  goSearchTalleres();
                }}
                className="relative"
              >
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar talleres…"
                  className="ce-field mt-0 w-full py-2 pl-9 pr-3"
                />
              </form>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileSearchOpen((v) => !v)}
                className="ce-btn ce-btn-ghost px-3 py-2 text-xs lg:hidden"
                aria-label={mobileSearchOpen ? 'Cerrar búsqueda' : 'Buscar talleres'}
                title={mobileSearchOpen ? 'Cerrar búsqueda' : 'Buscar talleres'}
              >
                {mobileSearchOpen ? <X size={16} /> : <Search size={16} />}
              </button>

              <Link
                href="/perfil"
                className="ce-btn ce-btn-ghost px-3 py-2 text-xs"
                title="Perfil"
              >
                <User size={16} />
                <span className="hidden sm:inline">{me.user.username}</span>
              </Link>
              <span className="hidden text-xs text-zinc-400 sm:inline">{me.user.role}</span>
              <button
                onClick={logout}
                className="ce-btn ce-btn-ghost px-3 py-2 text-xs"
                type="button"
              >
                Salir
              </button>
            </div>
          </div>

          {mobileSearchOpen ? (
            <div className="border-t border-white/10 bg-zinc-950/60 px-4 py-3 backdrop-blur lg:hidden">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  goSearchTalleres();
                }}
                className="relative"
              >
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar talleres…"
                  className="ce-field mt-0 w-full py-2 pl-9 pr-3"
                />
              </form>
            </div>
          ) : null}
        </header>

        {sidebarOpen ? (
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            aria-label="Cerrar menú"
          />
        ) : null}

        {/* Sidebar - fixed position, full height */}
        <aside
          ref={asideRef}
          className={
            'fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 border-r border-white/10 bg-zinc-950/90 backdrop-blur transition-[transform,width] duration-200 ease-out lg:translate-x-0 lg:bg-zinc-950/70 lg:z-30 ' +
            (sidebarOpen ? 'translate-x-0' : '-translate-x-full ') +
            (sidebarCollapsed ? 'lg:w-20' : 'lg:w-72')
          }
        >
          <div
            className={
              'flex h-16 items-center gap-2 ' +
              (sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4')
            }
          >
            <div className={"text-sm font-semibold text-zinc-100 " + (sidebarCollapsed ? 'lg:hidden' : '')}>
              Navegación
            </div>
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="ce-btn ce-btn-ghost hidden lg:inline-flex h-9 w-9 items-center justify-center p-0"
              type="button"
              title={sidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
              aria-label={sidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ce-btn ce-btn-ghost px-3 py-2 text-xs lg:hidden"
              type="button"
            >
              Cerrar
            </button>
          </div>

          <nav className={"flex-1 overflow-y-auto px-3 py-3 " + (sidebarCollapsed ? 'lg:px-2' : '')}>
            <div className="space-y-1">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                const Icon = navIcon(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    title={sidebarCollapsed ? item.label : undefined}
                    aria-label={item.label}
                    className={
                      active
                        ? 'group flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:-translate-y-0.5 hover:bg-white/12 active:translate-y-0 active:scale-[0.99] ' +
                          (sidebarCollapsed ? 'lg:justify-center lg:px-2 lg:gap-0' : '')
                        : 'group flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/5 active:translate-y-0 active:scale-[0.99] ' +
                          (sidebarCollapsed ? 'lg:justify-center lg:px-2 lg:gap-0' : '')
                    }
                  >
                    <span
                      className={
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-zinc-100 transition group-hover:bg-white/10 ' +
                        (active ? 'shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_18px_rgba(217,70,239,0.20)]' : '')
                      }
                    >
                      <Icon size={18} className={active ? 'text-fuchsia-200' : 'text-zinc-100'} />
                    </span>
                    {sidebarCollapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>

            <div
              className={
                'mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 ' +
                (sidebarCollapsed ? 'lg:hidden' : '')
              }
            >
              <div className="text-xs font-semibold text-zinc-200">Acceso rápido</div>
              <div className="mt-3 space-y-2">
                <Link
                  href="/talleres"
                  onClick={() => setSidebarOpen(false)}
                  className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:-translate-y-0.5 hover:bg-black/30 active:translate-y-0 active:scale-[0.99]"
                >
                  Ver talleres
                </Link>
                {(role === 'teacher' || role === 'admin') && (
                  <Link
                    href="/intentos"
                    onClick={() => setSidebarOpen(false)}
                    className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:-translate-y-0.5 hover:bg-black/30 active:translate-y-0 active:scale-[0.99]"
                  >
                    Bandeja de intentos
                  </Link>
                )}
              </div>
            </div>
          </nav>
        </aside>

        {/* Main content area - takes remaining space, scrolls independently */}
        <main
          ref={mainRef}
          className={
            'flex-1 min-h-screen overflow-y-auto overscroll-contain transition-[margin] duration-200 ' +
            (mobileSearchOpen ? 'pt-28 lg:pt-16 ' : 'pt-16 ') +
            (sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72')
          }
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</div>
        </main>
      </div>
    </div>
  );

}
