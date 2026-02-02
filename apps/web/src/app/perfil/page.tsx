'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Flame, Trophy, Lock, BookOpen, FileText, LayoutDashboard } from 'lucide-react';
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

type Medal = {
  type: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
  earned: boolean;
  earnedAt?: string;
};

export default function PerfilPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [medals, setMedals] = useState<Medal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'avatar' | 'medals'>('stats');

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
      }

      setLoading(false);
    })();

    return () => { alive = false; };
  }, []);

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
        setProgress({
          ...progress,
          avatar: { ...progress.avatar, ...update },
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
              {role === 'teacher' ? '👨‍🏫' : role === 'admin' ? '⚙️' : role === 'experience_manager' ? '🎮' : '👤'}
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
        <div className="mt-8 flex gap-2 border-b border-white/10 pb-2">
          {(['stats', 'avatar', 'medals'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab
                  ? 'bg-fuchsia-500/20 text-fuchsia-200 border-b-2 border-fuchsia-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab === 'stats' && '📊 Estadísticas'}
              {tab === 'avatar' && '🎨 Avatar'}
              {tab === 'medals' && `🏅 Medallas (${earnedMedals.length})`}
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
      {isStudent && activeTab === 'medals' && (
        <div className="mt-6 space-y-6">
          {earnedMedals.length > 0 && (
            <div className="ce-card p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200 mb-4">
                <Trophy className="h-4 w-4 text-amber-400" />
                Medallas ganadas ({earnedMedals.length})
              </div>
              <div className="flex flex-wrap gap-4">
                {earnedMedals.map((medal) => (
                  <MedalBadge key={medal.type} medal={medal} size="lg" />
                ))}
              </div>
            </div>
          )}

          {unearnedMedals.length > 0 && (
            <div className="ce-card p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200 mb-4">
                <Lock className="h-4 w-4 text-zinc-400" />
                Por desbloquear ({unearnedMedals.length})
              </div>
              <div className="flex flex-wrap gap-4">
                {unearnedMedals.map((medal) => (
                  <MedalBadge key={medal.type} medal={medal} size="lg" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Staff view */}
      {!isStudent && (
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="ce-card p-5">
            <div className="text-sm font-semibold text-zinc-200">Accesos rápidos</div>
            <div className="mt-3 space-y-2">
              <Link href="/talleres" className="flex items-center gap-2 text-sm font-semibold text-fuchsia-300 hover:text-fuchsia-200">
                <BookOpen className="h-4 w-4" />
                Talleres
              </Link>
              {(role === 'teacher' || role === 'admin') && (
                <Link href="/intentos" className="flex items-center gap-2 text-sm font-semibold text-fuchsia-300 hover:text-fuchsia-200">
                  <FileText className="h-4 w-4" />
                  Bandeja de intentos
                </Link>
              )}
              <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-fuchsia-300 hover:text-fuchsia-200">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </div>
          </div>
          <div className="ce-card p-5">
            <div className="text-sm font-semibold text-zinc-200">Tu rol</div>
            <div className="mt-2 text-2xl font-bold capitalize text-fuchsia-300">{role}</div>
            <div className="mt-2 text-sm text-zinc-400">
              {role === 'teacher' && 'Puedes crear talleres, tests y calificar a tus alumnos.'}
              {role === 'admin' && 'Acceso completo a la plataforma.'}
              {role === 'reviewer' && 'Puedes revisar y aprobar talleres y tests.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
