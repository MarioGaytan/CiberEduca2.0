'use client';

import * as LucideIcons from 'lucide-react';

type Medal = {
  type: string;
  name: string;
  description: string;
  icon: string;
  iconType?: 'emoji' | 'lucide' | 'svg';
  iconColor?: string;
  bgColor?: string;
  xp: number;
  earned: boolean;
  earnedAt?: string;
};

type Props = {
  medal: Medal;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
};

const SIZE_CLASSES: Record<string, { container: string; icon: string; lucideSize: number }> = {
  sm: { container: 'h-10 w-10', icon: 'text-lg', lucideSize: 18 },
  md: { container: 'h-14 w-14', icon: 'text-2xl', lucideSize: 24 },
  lg: { container: 'h-20 w-20', icon: 'text-4xl', lucideSize: 36 },
};

function renderIcon(icon: string, iconType: string | undefined, size: string, color?: string) {
  const sizeClass = SIZE_CLASSES[size];
  
  if (iconType === 'lucide') {
    const IconComponent = (LucideIcons as Record<string, any>)[icon];
    if (IconComponent) {
      return (
        <IconComponent 
          size={sizeClass.lucideSize} 
          className={color ? '' : 'text-current'}
          style={color ? { color } : undefined}
        />
      );
    }
    return <span className={sizeClass.icon}>🏅</span>;
  }
  
  if (iconType === 'svg' && icon.startsWith('<svg')) {
    return (
      <div 
        className={sizeClass.icon}
        style={color ? { color } : undefined}
        dangerouslySetInnerHTML={{ __html: icon }}
      />
    );
  }
  
  return <span className={sizeClass.icon}>{icon}</span>;
}

export default function MedalBadge({ medal, size = 'md', showTooltip = true }: Props) {
  const sizeClass = SIZE_CLASSES[size];
  const bgStyle = medal.bgColor && medal.earned ? { backgroundColor: medal.bgColor } : undefined;
  const borderColor = medal.bgColor && medal.earned ? medal.bgColor : undefined;

  return (
    <div className="group relative">
      <div
        className={`${sizeClass.container} flex items-center justify-center rounded-full border transition-all ${
          medal.earned
            ? borderColor 
              ? 'shadow-lg' 
              : 'border-fuchsia-500/50 bg-fuchsia-500/20 shadow-[0_0_12px_rgba(217,70,239,0.3)]'
            : 'border-zinc-700 bg-zinc-800/50 opacity-40 grayscale'
        }`}
        style={medal.earned ? {
          ...bgStyle,
          borderColor: borderColor ? `${borderColor}80` : undefined,
        } : undefined}
      >
        {renderIcon(medal.icon, medal.iconType, size, medal.earned ? medal.iconColor : undefined)}
      </div>

      {showTooltip && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="whitespace-nowrap rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-center shadow-xl">
            <div className="text-sm font-semibold text-zinc-100">{medal.name}</div>
            <div className="mt-1 text-xs text-zinc-400">{medal.description}</div>
            {medal.earned && (
              <div className="mt-1 text-xs text-fuchsia-300">+{medal.xp} XP</div>
            )}
            {medal.earnedAt && (
              <div className="mt-1 text-xs text-zinc-500">
                {new Date(medal.earnedAt).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
