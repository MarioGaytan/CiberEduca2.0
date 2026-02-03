'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { 
  BookOpen, 
  Users, 
  FileCheck, 
  Clock, 
  PlusCircle,
  Inbox,
  ShieldCheck,
  Settings,
  TrendingUp,
  Award,
  Gamepad2
} from 'lucide-react';

type MeResponse =
  | { authenticated: true; user: { username: string; role: string } }
  | { authenticated: false };

type DashboardStats = {
  role: string;
  general: {
    totalWorkshops: number;
    approvedWorkshops: number;
    inReviewWorkshops: number;
    draftWorkshops: number;
  };
  admin?: {
    totalUsers: number;
    usersByRole: Record<string, number>;
    pendingRequests: number;
    recentActivity: Array<{
      type: string;
      description: string;
      date: string;
    }>;
  };
  teacher?: {
    myWorkshops: number;
    myDrafts: number;
    myInReview: number;
    myApproved: number;
    pendingGrades: number;
    testsCreated: number;
  };
  reviewer?: {
    pendingReview: number;
    pendingRequests: number;
    reviewedThisWeek: number;
  };
  experienceManager?: {
    activeMedals: number;
    activeAvatarStyles: number;
  };
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  teacher: 'Profesor',
  reviewer: 'Revisor',
  student: 'Estudiante',
  experience_manager: 'Gestor de Experiencia',
};

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = (await res.json()) as MeResponse;

      if (!alive) return;
      if (!res.ok || !data.authenticated) {
        router.replace('/login');
        return;
      }

      // Redirect students to Home - Dashboard is for staff only
      if (data.user.role === 'student') {
        router.replace('/home');
        return;
      }

      setMe(data);

      // Fetch dashboard stats
      const statsRes = await fetch('/api/dashboard/stats', { cache: 'no-store' });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (alive) setStats(statsData);
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  const role = useMemo(() => {
    if (!me || !me.authenticated) return '';
    return me.user.role;
  }, [me]);

  if (loading || !me || !me.authenticated) {
    return (
      <div className="ce-card p-6 text-sm text-zinc-300">Cargando…</div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="ce-chip">{ROLE_LABELS[role] || role}</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Hola, <span className="ce-title-gradient">{me.user.username}</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-300">
            Panel de control
          </p>
        </div>
      </div>

      {/* Admin Stats */}
      {stats?.admin && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-fuchsia-400" />
            Estadísticas Generales
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <div className="ce-card p-5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-fuchsia-400" />
                <div className="text-sm font-semibold text-zinc-200">Total Usuarios</div>
              </div>
              <div className="mt-2 text-2xl font-semibold text-fuchsia-300">{stats.admin.totalUsers}</div>
            </div>
            <div className="ce-card p-5">
              <div className="text-sm font-semibold text-zinc-200">Estudiantes</div>
              <div className="mt-2 text-2xl font-semibold text-cyan-300">{stats.admin.usersByRole.student || 0}</div>
            </div>
            <div className="ce-card p-5">
              <div className="text-sm font-semibold text-zinc-200">Profesores</div>
              <div className="mt-2 text-2xl font-semibold text-blue-300">{stats.admin.usersByRole.teacher || 0}</div>
            </div>
            <div className="ce-card p-5">
              <div className="text-sm font-semibold text-zinc-200">Revisores</div>
              <div className="mt-2 text-2xl font-semibold text-amber-300">{stats.admin.usersByRole.reviewer || 0}</div>
            </div>
            <div className="ce-card p-5">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-400" />
                <div className="text-sm font-semibold text-zinc-200">Solicitudes</div>
              </div>
              <div className="mt-2 text-2xl font-semibold text-red-300">{stats.admin.pendingRequests}</div>
              <div className="mt-1 text-xs text-zinc-400">Pendientes</div>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Stats */}
      {stats?.teacher && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-cyan-400" />
            Mis Contenidos
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="ce-card p-5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-fuchsia-400" />
                <div className="text-sm font-semibold text-zinc-200">Mis Talleres</div>
              </div>
              <div className="mt-2 text-2xl font-semibold text-fuchsia-300">{stats.teacher.myWorkshops}</div>
            </div>
            <div className="ce-card p-5">
              <div className="text-sm font-semibold text-zinc-200">Borradores</div>
              <div className="mt-2 text-2xl font-semibold text-zinc-400">{stats.teacher.myDrafts}</div>
              <div className="mt-1 text-xs text-zinc-400">Sin publicar</div>
            </div>
            <div className="ce-card p-5">
              <div className="text-sm font-semibold text-zinc-200">En Revisión</div>
              <div className="mt-2 text-2xl font-semibold text-cyan-300">{stats.teacher.myInReview}</div>
            </div>
            <div className="ce-card p-5">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-amber-400" />
                <div className="text-sm font-semibold text-zinc-200">Por Calificar</div>
              </div>
              <div className="mt-2 text-2xl font-semibold text-amber-300">{stats.teacher.pendingGrades}</div>
              <div className="mt-1 text-xs text-zinc-400">Intentos</div>
            </div>
          </div>
        </div>
      )}

      {/* Reviewer Stats */}
      {stats?.reviewer && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-400" />
            Revisión de Contenido
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div className="ce-card p-5">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                <div className="text-sm font-semibold text-zinc-200">Pendientes</div>
              </div>
              <div className="mt-2 text-2xl font-semibold text-cyan-300">{stats.reviewer.pendingReview}</div>
              <div className="mt-1 text-xs text-zinc-400">Talleres por revisar</div>
            </div>
            <div className="ce-card p-5">
              <div className="text-sm font-semibold text-zinc-200">Solicitudes</div>
              <div className="mt-2 text-2xl font-semibold text-amber-300">{stats.reviewer.pendingRequests}</div>
              <div className="mt-1 text-xs text-zinc-400">Edición/Eliminación</div>
            </div>
            <div className="ce-card p-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <div className="text-sm font-semibold text-zinc-200">Esta Semana</div>
              </div>
              <div className="mt-2 text-2xl font-semibold text-green-300">{stats.reviewer.reviewedThisWeek}</div>
              <div className="mt-1 text-xs text-zinc-400">Revisados</div>
            </div>
          </div>
        </div>
      )}

      {/* Experience Manager Stats */}
      {(role === 'experience_manager' || role === 'admin') && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-purple-400" />
            Gamificación
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <Link href="/admin/experiencia" className="ce-card ce-card-hover p-5">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                <div className="text-sm font-semibold text-zinc-200">Medallas</div>
              </div>
              <div className="mt-2 text-sm text-zinc-400">Configurar logros y recompensas</div>
              <div className="mt-3">
                <span className="ce-btn ce-btn-ghost text-xs">Gestionar</span>
              </div>
            </Link>
            <Link href="/admin/experiencia" className="ce-card ce-card-hover p-5">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-cyan-400" />
                <div className="text-sm font-semibold text-zinc-200">XP y Niveles</div>
              </div>
              <div className="mt-2 text-sm text-zinc-400">Ajustar reglas de experiencia</div>
              <div className="mt-3">
                <span className="ce-btn ce-btn-ghost text-xs">Configurar</span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-fuchsia-400" />
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Teacher actions */}
          {(role === 'teacher' || role === 'admin') && (
            <>
              <Link href="/talleres/nuevo" className="ce-card ce-card-hover block p-5">
                <div className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-fuchsia-400" />
                  <div className="text-sm font-semibold text-zinc-200">Crear taller</div>
                </div>
                <div className="mt-2 text-sm text-zinc-400">
                  Nuevo borrador con tests de opción múltiple o abiertas.
                </div>
                <div className="mt-4">
                  <span className="ce-btn ce-btn-primary">+ Crear taller</span>
                </div>
              </Link>

              <Link href="/intentos" className="ce-card ce-card-hover block p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Inbox className="h-4 w-4 text-amber-400" />
                    <div className="text-sm font-semibold text-zinc-200">Calificar intentos</div>
                  </div>
                  {stats?.teacher && stats.teacher.pendingGrades > 0 && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                      {stats.teacher.pendingGrades}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm text-zinc-400">
                  Revisar preguntas abiertas de tus alumnos.
                </div>
                <div className="mt-4">
                  <span className="ce-btn ce-btn-ghost">Ver bandeja</span>
                </div>
              </Link>

              <Link href="/talleres" className="ce-card ce-card-hover block p-5">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-cyan-400" />
                  <div className="text-sm font-semibold text-zinc-200">Mis talleres</div>
                </div>
                <div className="mt-2 text-sm text-zinc-400">
                  Editar, enviar a revisión o ver estadísticas.
                </div>
                <div className="mt-4">
                  <span className="ce-btn ce-btn-ghost">Ver talleres</span>
                </div>
              </Link>
            </>
          )}

          {/* Reviewer/Admin actions */}
          {(role === 'reviewer' || role === 'admin') && (
            <Link href="/admin/revision" className="ce-card ce-card-hover block p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  <div className="text-sm font-semibold text-zinc-200">Bandeja de revisión</div>
                </div>
                {stats?.reviewer && stats.reviewer.pendingReview > 0 && (
                  <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-bold text-cyan-300">
                    {stats.reviewer.pendingReview}
                  </span>
                )}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                Aprobar o rechazar talleres y tests antes de publicarlos.
              </div>
              <div className="mt-4">
                <span className="ce-btn ce-btn-soft">Abrir revisión</span>
              </div>
            </Link>
          )}

          {/* Admin-only */}
          {role === 'admin' && (
            <Link href="/admin/usuarios" className="ce-card ce-card-hover block p-5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-fuchsia-400" />
                <div className="text-sm font-semibold text-zinc-200">Administrar usuarios</div>
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                Crear maestros, revisores y alumnos.
              </div>
              <div className="mt-4">
                <span className="ce-btn ce-btn-soft">Gestionar</span>
              </div>
            </Link>
          )}

          {/* Experience Manager actions */}
          {role === 'experience_manager' && (
            <Link href="/admin/experiencia" className="ce-card ce-card-hover block p-5">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-purple-400" />
                <div className="text-sm font-semibold text-zinc-200">Configurar Experiencia</div>
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                Gestionar medallas, XP, niveles y avatares.
              </div>
              <div className="mt-4">
                <span className="ce-btn ce-btn-soft">Abrir configuración</span>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Activity for Admin */}
      {stats?.admin?.recentActivity && stats.admin.recentActivity.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Actividad Reciente
          </h2>
          <div className="ce-card p-5">
            <div className="space-y-3">
              {stats.admin.recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <FileCheck className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span className="text-zinc-300">{activity.description}</span>
                  <span className="text-xs text-zinc-500 ml-auto">
                    {new Date(activity.date).toLocaleDateString('es-MX')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
