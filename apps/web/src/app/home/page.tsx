'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import ProgressCard from '../_components/progress/ProgressCard';
import RankingCard from '../_components/progress/RankingCard';

type MeResponse =
  | { authenticated: true; user: { username: string; role: string } }
  | { authenticated: false };

type Workshop = {
  _id: string;
  title: string;
  description?: string;
  status: 'draft' | 'in_review' | 'approved';
  visibility: 'internal' | 'code';
};

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

export default function HomePage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const role = useMemo(() => (me && me.authenticated ? me.user.role : ''), [me]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
      const meData = (await meRes.json()) as MeResponse;
      if (!alive) return;
      setMe(meData);

      // Redirect teachers/admin/reviewer to Dashboard
      if (meRes.ok && meData.authenticated) {
        const r = meData.user.role;
        if (r === 'teacher' || r === 'admin' || r === 'reviewer') {
          router.replace('/dashboard');
          return;
        }
      }

      // Fetch workshops, progress, and ranking in parallel
      const [wsRes, progressRes, rankingRes] = await Promise.all([
        fetch('/api/workshops', { cache: 'no-store' }),
        fetch('/api/progress/me', { cache: 'no-store' }),
        fetch('/api/progress/ranking?limit=10', { cache: 'no-store' }),
      ]);

      if (!alive) return;

      const wsData = (await wsRes.json().catch(() => [])) as any;
      const allWs = Array.isArray(wsData) ? (wsData as Workshop[]) : [];
      setWorkshops(allWs.filter((w) => w.status === 'approved'));

      const progressData = (await progressRes.json().catch(() => null)) as any;
      if (progressData && progressData.userId) {
        setProgress(progressData);
      }

      const rankingData = (await rankingRes.json().catch(() => [])) as any;
      if (Array.isArray(rankingData)) {
        setRanking(rankingData);
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="ce-chip">Inicio</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            {me && me.authenticated ? (
              <span>
                Hola, <span className="ce-title-gradient">{me.user.username}</span>
              </span>
            ) : (
              'CiberEduca'
            )}
          </h1>
          <p className="mt-2 text-sm text-zinc-300">Explora talleres y resuelve tests para aprender.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/talleres"
            className="ce-btn ce-btn-primary"
          >
            Ver talleres
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 ce-card p-6 text-sm text-zinc-300">Cargando…</div>
      ) : (
        <>
          {/* Progress and Ranking section */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ProgressCard progress={progress} compact />
            </div>
            <div>
              <RankingCard ranking={ranking} maxEntries={5} />
            </div>
          </div>

          {/* Quick guide for new users */}
          {progress && progress.testsCompletedCount === 0 && (
            <div className="mt-6 ce-card ce-card-hover p-5 border-l-4 border-fuchsia-500">
              <div className="text-sm font-semibold text-zinc-200">🚀 ¿Primera vez aquí?</div>
              <ol className="mt-3 space-y-2 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/20 text-xs font-bold text-fuchsia-300">1</span>
                  <span>Elige un taller de la lista de abajo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/20 text-xs font-bold text-fuchsia-300">2</span>
                  <span>Abre un test y responde las preguntas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/20 text-xs font-bold text-fuchsia-300">3</span>
                  <span>¡Gana XP, sube de nivel y desbloquea medallas!</span>
                </li>
              </ol>
            </div>
          )}

          {/* How to earn XP section */}
          <div className="mt-6 ce-card p-5">
            <div className="text-sm font-semibold text-zinc-200">⭐ ¿Cómo ganar experiencia (XP)?</div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-black/20 p-3">
                <div className="text-lg font-bold text-emerald-400">+XP</div>
                <div className="text-xs text-zinc-400">Por cada punto en un test</div>
              </div>
              <div className="rounded-xl bg-black/20 p-3">
                <div className="text-lg font-bold text-amber-400">+20 XP</div>
                <div className="text-xs text-zinc-400">Bonus por test perfecto (100%)</div>
              </div>
              <div className="rounded-xl bg-black/20 p-3">
                <div className="text-lg font-bold text-fuchsia-400">+5 XP</div>
                <div className="text-xs text-zinc-400">Por día de racha activa</div>
              </div>
              <div className="rounded-xl bg-black/20 p-3">
                <div className="text-lg font-bold text-cyan-400">🏅</div>
                <div className="text-xs text-zinc-400">Medallas por logros especiales</div>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-gradient-to-r from-fuchsia-500/10 to-cyan-500/10 p-3">
              <div className="text-xs text-zinc-300">
                <strong>Tip:</strong> Completa tests todos los días para mantener tu racha y ganar XP extra.
                Personaliza tu avatar en tu <Link href="/perfil" className="text-fuchsia-300 hover:underline">perfil</Link>.
              </div>
            </div>
          </div>

          {/* Workshops list */}
          <div className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">Talleres disponibles</h2>
                <p className="mt-1 text-sm text-zinc-400">Selecciona uno para ver sus tests.</p>
              </div>
              <Link href="/talleres" className="text-sm font-semibold text-fuchsia-300 hover:text-fuchsia-200">
                Ver todos →
              </Link>
            </div>

            {workshops.length === 0 ? (
              <div className="mt-4 ce-card p-6 text-sm text-zinc-300">No hay talleres disponibles aún. Tu maestro los publicará pronto.</div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {workshops.slice(0, 4).map((w) => (
                  <Link
                    key={w._id}
                    href={`/talleres/${w._id}`}
                    className="ce-card ce-card-hover block p-5"
                  >
                    <div className="text-sm font-semibold text-zinc-100">{w.title}</div>
                    {w.description ? <div className="mt-2 text-sm text-zinc-400 line-clamp-2">{w.description}</div> : null}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
