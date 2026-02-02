'use client';

import { useState } from 'react';
import MedalBadge, { Medal } from '../progress/MedalBadge';
import { Trophy, Lock, CheckCircle, TrendingUp } from 'lucide-react';

type MedalWithProgress = Medal & {
  conditionType: string;
  conditionValue: number;
  currentProgress?: number;
};

type StudentStats = {
  testsCompleted: number;
  workshopsCompleted: number;
  perfectScores: number;
  streakDays: number;
  rankingPosition: number;
  totalXp: number;
  level: number;
};

type Props = {
  medals: MedalWithProgress[];
  studentStats: StudentStats;
  showProgress?: boolean;
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

function getProgressValue(stats: StudentStats, conditionType: string): number {
  switch (conditionType) {
    case 'tests_completed': return stats.testsCompleted;
    case 'workshops_completed': return stats.workshopsCompleted;
    case 'perfect_scores': return stats.perfectScores;
    case 'streak_days': return stats.streakDays;
    case 'ranking_position': return stats.rankingPosition;
    case 'total_xp': return stats.totalXp;
    case 'level_reached': return stats.level;
    default: return 0;
  }
}

function isConditionMet(stats: StudentStats, conditionType: string, conditionValue: number): boolean {
  const current = getProgressValue(stats, conditionType);
  if (conditionType === 'ranking_position') {
    return current <= conditionValue && current > 0;
  }
  return current >= conditionValue;
}

export default function StudentMedalsPreview({ medals, studentStats, showProgress = true }: Props) {
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  const medalsWithStatus = medals.map(medal => ({
    ...medal,
    earned: isConditionMet(studentStats, medal.conditionType, medal.conditionValue),
    currentProgress: getProgressValue(studentStats, medal.conditionType),
  }));

  const earnedCount = medalsWithStatus.filter(m => m.earned).length;
  const totalXpFromMedals = medalsWithStatus
    .filter(m => m.earned)
    .reduce((sum, m) => sum + m.xp, 0);

  const filteredMedals = medalsWithStatus.filter(medal => {
    if (filter === 'earned') return medal.earned;
    if (filter === 'locked') return !medal.earned;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="ce-card p-4 bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10">
          <div className="flex items-center gap-2 text-fuchsia-300">
            <Trophy className="h-5 w-5" />
            <span className="text-2xl font-bold">{earnedCount}</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Medallas obtenidas</p>
        </div>
        <div className="ce-card p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
          <div className="flex items-center gap-2 text-amber-300">
            <TrendingUp className="h-5 w-5" />
            <span className="text-2xl font-bold">{totalXpFromMedals}</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">XP de medallas</p>
        </div>
        <div className="ce-card p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
          <div className="flex items-center gap-2 text-green-300">
            <CheckCircle className="h-5 w-5" />
            <span className="text-2xl font-bold">{Math.round((earnedCount / medals.length) * 100)}%</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Progreso total</p>
        </div>
        <div className="ce-card p-4 bg-gradient-to-br from-zinc-500/10 to-zinc-600/10">
          <div className="flex items-center gap-2 text-zinc-300">
            <Lock className="h-5 w-5" />
            <span className="text-2xl font-bold">{medals.length - earnedCount}</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Por desbloquear</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'earned', 'locked'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/50'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            {f === 'all' ? `Todas (${medals.length})` : 
             f === 'earned' ? `Obtenidas (${earnedCount})` : 
             `Bloqueadas (${medals.length - earnedCount})`}
          </button>
        ))}
      </div>

      {/* Medals Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredMedals.map((medal) => (
          <div
            key={medal.type}
            className={`ce-card p-4 text-center transition-all ${
              medal.earned ? '' : 'opacity-60'
            }`}
          >
            <div className="flex justify-center mb-3">
              <MedalBadge medal={medal} size="lg" showTooltip={false} />
            </div>
            <h4 className="font-semibold text-zinc-100 text-sm">{medal.name}</h4>
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{medal.description}</p>
            
            {showProgress && !medal.earned && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>{CONDITION_LABELS[medal.conditionType]}</span>
                  <span>{medal.currentProgress}/{medal.conditionValue}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (medal.currentProgress! / medal.conditionValue) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            
            {medal.earned && (
              <div className="mt-2 flex items-center justify-center gap-1 text-xs text-fuchsia-300">
                <CheckCircle className="h-3 w-3" />
                <span>+{medal.xp} XP</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredMedals.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No hay medallas en esta categoría</p>
        </div>
      )}
    </div>
  );
}
