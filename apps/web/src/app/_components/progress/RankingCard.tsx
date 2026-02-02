'use client';

import { Trophy, Medal } from 'lucide-react';
import DiceBearAvatar from '../avatar/DiceBearAvatar';

type AvatarData = {
  style?: string;
  skinColor?: string;
  backgroundColor?: string;
  top?: string;
  eyes?: string;
  mouth?: string;
  accessories?: string;
  base?: string;
  color?: string;
  frame?: string;
};

type RankingEntry = {
  position: number;
  userId: string;
  username: string;
  totalXp: number;
  level: number;
  workshopsCompleted: number;
  testsCompleted: number;
  medalCount: number;
  avatar?: AvatarData;
  isMe: boolean;
};

type Props = {
  ranking: RankingEntry[];
  maxEntries?: number;
};

const POSITION_STYLES: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-zinc-300',
  3: 'text-amber-600',
};

const POSITION_COLORS: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-zinc-300',
  3: 'text-amber-600',
};

export default function RankingCard({ ranking, maxEntries = 10 }: Props) {
  const entries = ranking.slice(0, maxEntries);

  if (entries.length === 0) {
    return (
      <div className="ce-card p-5 text-center text-sm text-zinc-400">
        No hay datos de ranking aún.
      </div>
    );
  }

  return (
    <div className="ce-card overflow-hidden">
      <div className="border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Trophy className="h-4 w-4 text-amber-400" />
          Ranking
        </div>
      </div>
      <div className="divide-y divide-white/5">
        {entries.map((entry) => (
          <div
            key={entry.userId}
            className={`flex items-center gap-3 px-5 py-3 transition-colors ${
              entry.isMe ? 'bg-fuchsia-500/10' : 'hover:bg-white/5'
            }`}
          >
            <div className={`w-8 flex items-center justify-center font-bold ${POSITION_STYLES[entry.position] || 'text-zinc-500'}`}>
              {entry.position <= 3 ? (
                <Medal className={`h-5 w-5 ${POSITION_COLORS[entry.position]}`} />
              ) : (
                `#${entry.position}`
              )}
            </div>
            <DiceBearAvatar config={entry.avatar || {}} seed={entry.username} size="sm" className="bg-zinc-800" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`truncate text-sm font-medium ${entry.isMe ? 'text-fuchsia-200' : 'text-zinc-200'}`}>
                  {entry.username}
                </span>
                {entry.isMe && (
                  <span className="rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-xs text-fuchsia-300">Tú</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>Nivel {entry.level}</span>
                <span>•</span>
                <span>{entry.workshopsCompleted} talleres</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-fuchsia-300">{entry.totalXp.toLocaleString()} XP</div>
              <div className="flex items-center justify-end gap-1 text-xs text-zinc-500">
                {entry.medalCount} <Medal className="h-3 w-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
