'use client';

import Link from 'next/link';
import StudentAvatar from './StudentAvatar';
import ProgressBar from './ProgressBar';
import MedalBadge from './MedalBadge';

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
  medals: Array<{
    type: string;
    earnedAt: string;
  }>;
  avatar: {
    base: string;
    color: string;
    accessories: string[];
    frame: string;
  };
};

type Props = {
  progress: ProgressData | null;
  compact?: boolean;
};

export default function ProgressCard({ progress, compact = false }: Props) {
  if (!progress) {
    return (
      <div className="ce-card p-5 text-center text-sm text-zinc-400">
        Cargando progreso...
      </div>
    );
  }

  if (compact) {
    return (
      <div className="ce-card ce-card-hover p-5">
        <div className="flex items-center gap-4">
          <StudentAvatar avatar={progress.avatar} username={progress.username} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-zinc-100">Nivel {progress.level}</span>
              <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-xs font-medium text-fuchsia-300">
                #{progress.rankingPosition}
              </span>
            </div>
            <div className="mt-1 text-sm text-zinc-400">
              {progress.totalXp.toLocaleString()} XP total
            </div>
            <div className="mt-2">
              <ProgressBar
                current={progress.xpProgress}
                max={progress.xpNeeded}
                color="fuchsia"
                size="sm"
              />
              <div className="mt-1 text-xs text-zinc-500">
                {progress.xpProgress}/{progress.xpNeeded} XP para nivel {progress.level + 1}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
          <div className="text-center">
            <div className="text-xl font-bold text-fuchsia-300">{progress.workshopsCompletedCount}</div>
            <div className="text-xs text-zinc-400">Talleres</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-cyan-300">{progress.testsCompletedCount}</div>
            <div className="text-xs text-zinc-400">Tests</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-amber-300">{progress.currentStreak}🔥</div>
            <div className="text-xs text-zinc-400">Racha</div>
          </div>
        </div>
        <Link
          href="/perfil"
          className="mt-4 block text-center text-sm font-medium text-fuchsia-300 hover:text-fuchsia-200"
        >
          Ver perfil completo →
        </Link>
      </div>
    );
  }

  return (
    <div className="ce-card p-6">
      <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
        <div className="text-center">
          <StudentAvatar avatar={progress.avatar} username={progress.username} size="xl" />
          <div className="mt-3 text-lg font-semibold text-zinc-100">{progress.username}</div>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-sm text-zinc-400">Ranking</span>
            <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-sm font-bold text-fuchsia-300">
              #{progress.rankingPosition}
            </span>
            <span className="text-xs text-zinc-500">de {progress.totalStudents}</span>
          </div>
        </div>

        <div className="flex-1 w-full">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-zinc-100">Nivel {progress.level}</div>
              <div className="text-sm text-zinc-400">{progress.totalXp.toLocaleString()} XP total</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-amber-300">{progress.currentStreak} 🔥</div>
              <div className="text-xs text-zinc-400">Racha actual</div>
            </div>
          </div>

          <div className="mt-4">
            <ProgressBar
              current={progress.xpProgress}
              max={progress.xpNeeded}
              label={`XP para nivel ${progress.level + 1}`}
              showPercentage
              color="fuchsia"
              size="lg"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <div className="text-2xl font-bold text-fuchsia-300">{progress.workshopsCompletedCount}</div>
              <div className="text-xs text-zinc-400">Talleres completados</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <div className="text-2xl font-bold text-cyan-300">{progress.testsCompletedCount}</div>
              <div className="text-xs text-zinc-400">Tests completados</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <div className="text-2xl font-bold text-green-300">{progress.completionPercentage}%</div>
              <div className="text-xs text-zinc-400">Progreso total</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <div className="text-2xl font-bold text-amber-300">{progress.medals.length}</div>
              <div className="text-xs text-zinc-400">Medallas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
