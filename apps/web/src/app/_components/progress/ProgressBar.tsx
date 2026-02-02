'use client';

type Props = {
  current: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'fuchsia' | 'cyan' | 'amber' | 'green';
  size?: 'sm' | 'md' | 'lg';
};

const COLOR_CLASSES: Record<string, string> = {
  fuchsia: 'from-fuchsia-500 to-pink-500',
  cyan: 'from-cyan-400 to-blue-500',
  amber: 'from-amber-400 to-orange-500',
  green: 'from-green-400 to-emerald-500',
};

const SIZE_CLASSES: Record<string, string> = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

export default function ProgressBar({
  current,
  max,
  label,
  showPercentage = false,
  color = 'fuchsia',
  size = 'md',
}: Props) {
  const percentage = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
          {label && <span>{label}</span>}
          {showPercentage && <span>{percentage}%</span>}
        </div>
      )}
      <div className={`${SIZE_CLASSES[size]} w-full overflow-hidden rounded-full bg-zinc-800`}>
        <div
          className={`${SIZE_CLASSES[size]} rounded-full bg-gradient-to-r ${COLOR_CLASSES[color]} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
