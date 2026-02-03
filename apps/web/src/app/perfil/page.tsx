'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Flame, Trophy, Lock, BookOpen, FileText, LayoutDashboard, TrendingUp, CheckCircle, BarChart3, Palette, Award, GraduationCap, Settings, Gamepad2, User, KeyRound, UserCircle, Users, Clock, Inbox, ShieldCheck, PlusCircle } from 'lucide-react';
import ProgressCard from '../_components/progress/ProgressCard';
import StudentAvatar from '../_components/progress/StudentAvatar';
import MedalBadge from '../_components/progress/MedalBadge';
import ProgressBar from '../_components/progress/ProgressBar';
import AvatarEditorV2 from '../_components/avatar/AvatarEditorV2';
import DiceBearAvatar, { DiceBearConfig } from '../_components/avatar/DiceBearAvatar';

type MeResponse =
  | { authenticated: true; user: { username: string; role: string } }
  | { authenticated: false };

type AvatarData = Partial<DiceBearConfig> & {
  base?: string;
  color?: string;
  frame?: string;
};

type ProgressData = {
  userId: string;
  username: string;
  totalXp: number;
  level: number;
  xpProgress: number;
  xpNeeded: number;
  xpPercentage: number;
  workshopsCompletedCount: number;
  testsCompletedCount: number;
  availableWorkshops: number;
  completionPercentage: number;
  currentStreak: number;
  longestStreak: number;
  rankingPosition: number;
  totalStudents: number;
  medals: Array<{ type: string; earnedAt: string }>;
  avatar: AvatarData;
};

type MedalShape = 'circle' | 'shield' | 'star' | 'hexagon' | 'diamond' | 'badge';

type StaffStats = {
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
};

type Medal = {
  type: string;
  name: string;
  description: string;
  icon: string;
  iconType?: 'emoji' | 'lucide' | 'svg';
  iconColor?: string;
  bgColor?: string;
  borderColor?: string;
  shape?: MedalShape;
  glow?: boolean;
  xp: number;
  earned: boolean;
  earnedAt?: string;
  conditionType?: string;
  conditionValue?: number;
};

const CONDITION_LABELS: Record<string, string> = {
  tests_completed: 'Tests completados',
  workshops_completed: 'Talleres completados',
  perfect_scores: 'Puntuaciones perfectas',
  streak_days: 'Días de racha',
  ranking_position: 'Posición en ranking',
  total_xp: 'XP total',
  level_reached: 'Nivel alcanzado',
};

export default function PerfilPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [medals, setMedals] = useState<Medal[]>([]);
  const [staffStats, setStaffStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'avatar' | 'medals' | 'settings'>('stats');

  // Profile edit states
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const role = useMemo(() => (me && me.authenticated ? me.user.role : ''), [me]);
  const isStudent = role === 'student';

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = (await res.json()) as MeResponse;
      if (!alive) return;
      setMe(data);

      if (data.authenticated && data.user.role === 'student') {
        const [progressRes, medalsRes] = await Promise.all([
          fetch('/api/progress/me', { cache: 'no-store' }),
          fetch('/api/progress/medals', { cache: 'no-store' }),
        ]);

        if (!alive) return;

        const progressData = await progressRes.json().catch(() => null);
        if (progressData?.userId) setProgress(progressData);

        const medalsData = await medalsRes.json().catch(() => []);
        if (Array.isArray(medalsData)) setMedals(medalsData);
      } else if (data.authenticated && data.user.role !== 'student') {
        // Fetch staff stats
        const statsRes = await fetch('/api/dashboard/stats', { cache: 'no-store' });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (alive) setStaffStats(statsData);
        }
      }

      setLoading(false);
    })();

    return () => { alive = false; };
  }, []);

  // Initialize edit fields when user data loads
  useEffect(() => {
    if (me && me.authenticated) {
      setEditUsername(me.user.username);
    }
  }, [me]);

  async function onUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);
    setProfileSaving(true);

    try {
      const res = await fetch('/api/users/me/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username: editUsername.trim() || undefined,
          email: editEmail.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setProfileMessage({ type: 'error', text: data.message || 'Error al actualizar el perfil.' });
      } else {
        setProfileMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
        // Update local state
        if (me && me.authenticated) {
          setMe({
            ...me,
            user: { ...me.user, username: data.username || me.user.username },
          });
        }
      }
    } catch {
      setProfileMessage({ type: 'error', text: 'Error de conexión.' });
    }

    setProfileSaving(false);
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordMessage({ type: 'error', text: data.message || 'Error al cambiar la contraseña.' });
      } else {
        setPasswordMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Error de conexión.' });
    }

    setPasswordSaving(false);
  }

  async function onLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  async function updateAvatar(update: Partial<DiceBearConfig>) {
    if (!progress) return;
    setSaving(true);
    try {
      const res = await fetch('/api/progress/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      if (res.ok) {
        const savedAvatar = await res.json();
        setProgress((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            avatar: savedAvatar,
          };
        });
      }
    } catch (e) {
      console.error('Failed to update avatar:', e);
    }
    setSaving(false);
  }

  if (loading || !me || !me.authenticated) {
    return <div className="ce-card p-6 text-sm text-zinc-300">Cargando…</div>;
  }

  const earnedMedals = medals.filter(m => m.earned);
  const unearnedMedals = medals.filter(m => !m.earned);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          {isStudent && progress ? (
            <DiceBearAvatar config={progress.avatar} seed={me.user.username} size="xl" className="bg-zinc-800" />
          ) : (
            <div className="h-20 w-20 flex items-center justify-center rounded-full bg-zinc-800 text-3xl">
              {role === 'teacher' ? <GraduationCap className="h-10 w-10 text-fuchsia-400" /> : role === 'admin' ? <Settings className="h-10 w-10 text-cyan-400" /> : role === 'experience_manager' ? <Gamepad2 className="h-10 w-10 text-amber-400" /> : <User className="h-10 w-10 text-zinc-400" />}
            </div>
          )}
          <div>
            <div className="ce-chip">{isStudent ? `Nivel ${progress?.level || 1}` : 'Perfil'}</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{me.user.username}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              <span className="capitalize font-semibold text-zinc-200">{role}</span>
              {isStudent && progress && (
                <span className="ml-2">• #{progress.rankingPosition} en ranking</span>
              )}
            </p>
          </div>
        </div>
        <button onClick={onLogout} className="ce-btn ce-btn-danger" type="button">
          Cerrar sesión
        </button>
      </div>

      {/* Tabs for students */}
      {isStudent && (
        <div className="mt-8 flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
          {(['stats', 'avatar', 'medals', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-fuchsia-500/20 text-fuchsia-200 border-b-2 border-fuchsia-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab === 'stats' && <span className="flex items-center gap-1.5"><BarChart3 className="h-4 w-4" /> Estadísticas</span>}
              {tab === 'avatar' && <span className="flex items-center gap-1.5"><Palette className="h-4 w-4" /> Avatar</span>}
              {tab === 'medals' && <span className="flex items-center gap-1.5"><Award className="h-4 w-4" /> Medallas ({earnedMedals.length})</span>}
              {tab === 'settings' && <span className="flex items-center gap-1.5"><Settings className="h-4 w-4" /> Ajustes</span>}
            </button>
          ))}
        </div>
      )}

      {/* Tabs for staff */}
      {!isStudent && (
        <div className="mt-8 flex gap-2 border-b border-white/10 pb-2">
          {(['stats', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab
                  ? 'bg-fuchsia-500/20 text-fuchsia-200 border-b-2 border-fuchsia-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab === 'stats' && <span className="flex items-center gap-1.5"><BarChart3 className="h-4 w-4" /> Información</span>}
              {tab === 'settings' && <span className="flex items-center gap-1.5"><Settings className="h-4 w-4" /> Ajustes</span>}
            </button>
          ))}
        </div>
      )}

      {/* Stats tab */}
      {isStudent && activeTab === 'stats' && progress && (
        <div className="mt-6">
          <ProgressCard progress={progress} />
          
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="ce-card p-4 text-center">
              <div className="text-3xl font-bold text-fuchsia-300">{progress.totalXp.toLocaleString()}</div>
              <div className="mt-1 text-xs text-zinc-400">XP Total</div>
            </div>
            <div className="ce-card p-4 text-center">
              <div className="text-3xl font-bold text-cyan-300">{progress.testsCompletedCount}</div>
              <div className="mt-1 text-xs text-zinc-400">Tests completados</div>
            </div>
            <div className="ce-card p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-3xl font-bold text-amber-300">
                {progress.currentStreak}
                <Flame className="h-7 w-7 text-orange-500" />
              </div>
              <div className="mt-1 text-xs text-zinc-400">Racha actual</div>
            </div>
            <div className="ce-card p-4 text-center">
              <div className="text-3xl font-bold text-green-300">{progress.longestStreak}</div>
              <div className="mt-1 text-xs text-zinc-400">Mejor racha</div>
            </div>
          </div>
        </div>
      )}

      {/* Avatar customization tab - DiceBear Editor */}
      {isStudent && activeTab === 'avatar' && progress && (
        <div className="mt-6 space-y-6">
          {/* Progress info for unlocking */}
          <div className="ce-card p-4 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/10 to-cyan-500/10 border-fuchsia-500/20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Tu progreso de personalización</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Gana más XP para desbloquear estilos y opciones exclusivas
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-fuchsia-300">{progress.totalXp.toLocaleString()}</div>
                  <div className="text-xs text-zinc-500">XP</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-cyan-300">Nv. {progress.level}</div>
                  <div className="text-xs text-zinc-500">Nivel</div>
                </div>
              </div>
            </div>
          </div>

          <AvatarEditorV2
            currentConfig={progress.avatar}
            username={me.user.username}
            userXp={progress.totalXp}
            userLevel={progress.level}
            onSave={updateAvatar}
          />
        </div>
      )}

      {/* Medals tab */}
      {isStudent && activeTab === 'medals' && progress && (
        <div className="mt-6 space-y-6">
          {/* Stats Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="ce-card p-4 bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10">
              <div className="flex items-center gap-2 text-fuchsia-300">
                <Trophy className="h-5 w-5" />
                <span className="text-2xl font-bold">{earnedMedals.length}</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">Medallas obtenidas</p>
            </div>
            <div className="ce-card p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
              <div className="flex items-center gap-2 text-amber-300">
                <TrendingUp className="h-5 w-5" />
                <span className="text-2xl font-bold">{earnedMedals.reduce((sum, m) => sum + m.xp, 0)}</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">XP de medallas</p>
            </div>
            <div className="ce-card p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
              <div className="flex items-center gap-2 text-green-300">
                <CheckCircle className="h-5 w-5" />
                <span className="text-2xl font-bold">{medals.length > 0 ? Math.round((earnedMedals.length / medals.length) * 100) : 0}%</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">Progreso total</p>
            </div>
            <div className="ce-card p-4 bg-gradient-to-br from-zinc-500/10 to-zinc-600/10">
              <div className="flex items-center gap-2 text-zinc-300">
                <Lock className="h-5 w-5" />
                <span className="text-2xl font-bold">{unearnedMedals.length}</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">Por desbloquear</p>
            </div>
          </div>

          {/* Earned Medals */}
          {earnedMedals.length > 0 && (
            <div className="ce-card p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200 mb-4">
                <Trophy className="h-4 w-4 text-amber-400" />
                Medallas ganadas ({earnedMedals.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {earnedMedals.map((medal, idx) => (
                  <div key={medal.type || `earned-${idx}`} className="ce-card p-4 text-center bg-gradient-to-br from-fuchsia-500/5 to-purple-500/5 border-fuchsia-500/20">
                    <div className="flex justify-center mb-3">
                      <MedalBadge medal={medal} size="lg" showTooltip={false} />
                    </div>
                    <h4 className="font-semibold text-zinc-100 text-sm">{medal.name}</h4>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{medal.description}</p>
                    <div className="mt-2 flex items-center justify-center gap-1 text-xs text-fuchsia-300">
                      <CheckCircle className="h-3 w-3" />
                      <span>+{medal.xp} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unearned Medals with Progress */}
          {unearnedMedals.length > 0 && (
            <div className="ce-card p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200 mb-4">
                <Lock className="h-4 w-4 text-zinc-400" />
                Por desbloquear ({unearnedMedals.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {unearnedMedals.map((medal, idx) => {
                  const currentProgress = medal.conditionType ? (
                    medal.conditionType === 'tests_completed' ? progress.testsCompletedCount :
                    medal.conditionType === 'workshops_completed' ? progress.workshopsCompletedCount :
                    medal.conditionType === 'streak_days' ? progress.currentStreak :
                    medal.conditionType === 'ranking_position' ? progress.rankingPosition :
                    medal.conditionType === 'total_xp' ? progress.totalXp :
                    medal.conditionType === 'level_reached' ? progress.level : 0
                  ) : 0;
                  const progressPercent = medal.conditionValue 
                    ? Math.min(100, (currentProgress / medal.conditionValue) * 100) 
                    : 0;

                  return (
                    <div key={medal.type || `unearned-${idx}`} className="ce-card p-4 text-center opacity-70 hover:opacity-100 transition-opacity">
                      <div className="flex justify-center mb-3">
                        <MedalBadge medal={medal} size="lg" showTooltip={false} />
                      </div>
                      <h4 className="font-semibold text-zinc-100 text-sm">{medal.name}</h4>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{medal.description}</p>
                      
                      {medal.conditionType && medal.conditionValue && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-zinc-500 mb-1">
                            <span>{CONDITION_LABELS[medal.conditionType] || medal.conditionType}</span>
                            <span>{currentProgress}/{medal.conditionValue}</span>
                          </div>
                          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {medals.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No hay medallas disponibles</p>
            </div>
          )}
        </div>
      )}

      {/* Staff info view */}
      {!isStudent && activeTab === 'stats' && (
        <div className="mt-6 space-y-6">
          {/* Role Info Card */}
          <div className="ce-card p-5 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/10 to-cyan-500/10 border-fuchsia-500/20">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 flex items-center justify-center rounded-full bg-zinc-800">
                {role === 'teacher' ? <GraduationCap className="h-7 w-7 text-fuchsia-400" /> : 
                 role === 'admin' ? <Settings className="h-7 w-7 text-cyan-400" /> : 
                 role === 'reviewer' ? <ShieldCheck className="h-7 w-7 text-amber-400" /> :
                 role === 'experience_manager' ? <Gamepad2 className="h-7 w-7 text-purple-400" /> : 
                 <User className="h-7 w-7 text-zinc-400" />}
              </div>
              <div>
                <div className="text-2xl font-bold capitalize text-fuchsia-300">
                  {role === 'teacher' ? 'Profesor' : 
                   role === 'admin' ? 'Administrador' : 
                   role === 'reviewer' ? 'Revisor' : 
                   role === 'experience_manager' ? 'Gestor de Experiencia' : role}
                </div>
                <div className="text-sm text-zinc-400">
                  {role === 'teacher' && 'Puedes crear talleres, tests y calificar a tus alumnos.'}
                  {role === 'admin' && 'Acceso completo a la plataforma.'}
                  {role === 'reviewer' && 'Puedes revisar y aprobar talleres y tests.'}
                  {role === 'experience_manager' && 'Puedes gestionar la configuración de gamificación.'}
                </div>
              </div>
            </div>
          </div>

          {/* Admin Stats */}
          {staffStats?.admin && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-fuchsia-400" />
                Usuarios de la Plataforma
              </h3>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <div className="ce-card p-4 text-center">
                  <div className="text-2xl font-bold text-fuchsia-300">{staffStats.admin.totalUsers}</div>
                  <div className="text-xs text-zinc-400 mt-1">Total</div>
                </div>
                <div className="ce-card p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-300">{staffStats.admin.usersByRole.student || 0}</div>
                  <div className="text-xs text-zinc-400 mt-1">Estudiantes</div>
                </div>
                <div className="ce-card p-4 text-center">
                  <div className="text-2xl font-bold text-blue-300">{staffStats.admin.usersByRole.teacher || 0}</div>
                  <div className="text-xs text-zinc-400 mt-1">Profesores</div>
                </div>
                <div className="ce-card p-4 text-center">
                  <div className="text-2xl font-bold text-amber-300">{staffStats.admin.usersByRole.reviewer || 0}</div>
                  <div className="text-xs text-zinc-400 mt-1">Revisores</div>
                </div>
                <div className="ce-card p-4 text-center">
                  <div className="text-2xl font-bold text-red-300">{staffStats.admin.pendingRequests}</div>
                  <div className="text-xs text-zinc-400 mt-1">Solicitudes</div>
                </div>
              </div>
            </div>
          )}

          {/* Teacher Stats */}
          {staffStats?.teacher && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-cyan-400" />
                Mis Contenidos
              </h3>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="ce-card p-4 text-center">
                  <div className="text-2xl font-bold text-fuchsia-300">{staffStats.teacher.myWorkshops}</div>
                  <div className="text-xs text-zinc-400 mt-1">Mis Talleres</div>
                </div>
                <div className="ce-card p-4 text-center">
                  <div className="text-2xl font-bold text-zinc-400">{staffStats.teacher.myDrafts}</div>
                  <div className="text-xs text-zinc-400 mt-1">Borradores</div>
                </div>
                <div className="ce-card p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-300">{staffStats.teacher.myApproved}</div>
                  <div className="text-xs text-zinc-400 mt-1">Aprobados</div>
                </div>
                <div className="ce-card p-4 text-center">
                  <div className="text-2xl font-bold text-green-300">{staffStats.teacher.testsCreated}</div>
                  <div className="text-xs text-zinc-400 mt-1">Tests Creados</div>
                </div>
              </div>
              {staffStats.teacher.pendingGrades > 0 && (
                <div className="mt-4 ce-card p-4 bg-amber-500/10 border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Inbox className="h-5 w-5 text-amber-400" />
                      <span className="text-sm font-semibold text-amber-200">
                        {staffStats.teacher.pendingGrades} intentos por calificar
                      </span>
                    </div>
                    <Link href="/intentos" className="ce-btn ce-btn-ghost text-xs">
                      Ver bandeja
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reviewer Stats */}
          {staffStats?.reviewer && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                Revisión de Contenido
              </h3>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                <div className="ce-card p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-300">{staffStats.reviewer.pendingReview}</div>
                  <div className="text-xs text-zinc-400 mt-1">Por Revisar</div>
                </div>
                <div className="ce-card p-4 text-center">
                  <div className="text-2xl font-bold text-amber-300">{staffStats.reviewer.pendingRequests}</div>
                  <div className="text-xs text-zinc-400 mt-1">Solicitudes</div>
                </div>
                <div className="ce-card p-4 text-center">
                  <div className="text-2xl font-bold text-green-300">{staffStats.reviewer.reviewedThisWeek}</div>
                  <div className="text-xs text-zinc-400 mt-1">Esta Semana</div>
                </div>
              </div>
              {staffStats.reviewer.pendingReview > 0 && (
                <div className="mt-4 ce-card p-4 bg-cyan-500/10 border-cyan-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-cyan-400" />
                      <span className="text-sm font-semibold text-cyan-200">
                        {staffStats.reviewer.pendingReview} talleres pendientes de revisión
                      </span>
                    </div>
                    <Link href="/admin/revision" className="ce-btn ce-btn-ghost text-xs">
                      Ver bandeja
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-fuchsia-400" />
              Accesos Rápidos
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/talleres" className="ce-card ce-card-hover p-4 flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-fuchsia-400" />
                <span className="text-sm font-semibold text-zinc-200">Talleres</span>
              </Link>
              {(role === 'teacher' || role === 'admin') && (
                <Link href="/intentos" className="ce-card ce-card-hover p-4 flex items-center gap-3">
                  <FileText className="h-5 w-5 text-amber-400" />
                  <span className="text-sm font-semibold text-zinc-200">Bandeja de intentos</span>
                </Link>
              )}
              {(role === 'reviewer' || role === 'admin') && (
                <Link href="/admin/revision" className="ce-card ce-card-hover p-4 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-cyan-400" />
                  <span className="text-sm font-semibold text-zinc-200">Revisión</span>
                </Link>
              )}
              {role === 'admin' && (
                <Link href="/admin/usuarios" className="ce-card ce-card-hover p-4 flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-semibold text-zinc-200">Usuarios</span>
                </Link>
              )}
              <Link href="/dashboard" className="ce-card ce-card-hover p-4 flex items-center gap-3">
                <LayoutDashboard className="h-5 w-5 text-purple-400" />
                <span className="text-sm font-semibold text-zinc-200">Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Settings tab - available for all users */}
      {activeTab === 'settings' && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Profile Edit Form */}
          <div className="ce-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200 mb-4">
              <UserCircle className="h-4 w-4 text-fuchsia-400" />
              Editar Perfil
            </div>
            <form onSubmit={onUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="ce-field mt-0"
                  placeholder="tu_usuario"
                  minLength={3}
                  disabled={profileSaving}
                />
                <p className="mt-1 text-xs text-zinc-500">Mínimo 3 caracteres, solo letras, números y guiones bajos.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Correo electrónico (opcional)
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="ce-field mt-0"
                  placeholder="correo@ejemplo.com"
                  disabled={profileSaving}
                />
              </div>

              {profileMessage && (
                <div className={`p-3 rounded-xl text-sm ${
                  profileMessage.type === 'success' 
                    ? 'bg-green-500/10 border border-green-500/20 text-green-200' 
                    : 'bg-red-500/10 border border-red-500/20 text-red-200'
                }`}>
                  {profileMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={profileSaving}
                className="ce-btn ce-btn-primary w-full"
              >
                {profileSaving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </div>

          {/* Password Change Form */}
          <div className="ce-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200 mb-4">
              <KeyRound className="h-4 w-4 text-cyan-400" />
              Cambiar Contraseña
            </div>
            <form onSubmit={onChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Contraseña actual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="ce-field mt-0"
                  placeholder="••••••••"
                  required
                  disabled={passwordSaving}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="ce-field mt-0"
                  placeholder="••••••••"
                  minLength={8}
                  required
                  disabled={passwordSaving}
                />
                <p className="mt-1 text-xs text-zinc-500">Mínimo 8 caracteres.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className={"ce-field mt-0 " + (confirmNewPassword && newPassword !== confirmNewPassword ? 'border-red-500/50' : '')}
                  placeholder="••••••••"
                  required
                  disabled={passwordSaving}
                />
                {confirmNewPassword && newPassword !== confirmNewPassword && (
                  <p className="mt-1 text-xs text-red-400">Las contraseñas no coinciden.</p>
                )}
                {confirmNewPassword && newPassword === confirmNewPassword && (
                  <p className="mt-1 text-xs text-green-400">✓ Las contraseñas coinciden.</p>
                )}
              </div>

              {passwordMessage && (
                <div className={`p-3 rounded-xl text-sm ${
                  passwordMessage.type === 'success' 
                    ? 'bg-green-500/10 border border-green-500/20 text-green-200' 
                    : 'bg-red-500/10 border border-red-500/20 text-red-200'
                }`}>
                  {passwordMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={passwordSaving}
                className="ce-btn ce-btn-primary w-full"
              >
                {passwordSaving ? 'Cambiando...' : 'Cambiar contraseña'}
              </button>
            </form>
          </div>

          {/* Privacy & Legal Links */}
          <div className="ce-card p-5 lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200 mb-4">
              <Lock className="h-4 w-4 text-green-400" />
              Privacidad y Legal
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/terminos" className="text-fuchsia-300 hover:text-fuchsia-200 transition-colors">
                Términos y Condiciones →
              </Link>
              <Link href="/privacidad" className="text-fuchsia-300 hover:text-fuchsia-200 transition-colors">
                Política de Privacidad →
              </Link>
              <Link href="/cookies" className="text-fuchsia-300 hover:text-fuchsia-200 transition-colors">
                Política de Cookies →
              </Link>
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              Tus datos personales están protegidos de acuerdo con la Ley Federal de Protección de Datos 
              Personales en Posesión de los Particulares (LFPDPPP).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
