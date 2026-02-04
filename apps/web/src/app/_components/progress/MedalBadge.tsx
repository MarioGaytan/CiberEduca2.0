'use client';

import * as LucideIcons from 'lucide-react';
import Icon from '../ui/Icon';

// Shape types matching MedalDesigner
export type MedalShape = 'circle' | 'shield' | 'star' | 'hexagon' | 'diamond' | 'badge';

export type Medal = {
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
};

type Props = {
  medal: Medal;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTooltip?: boolean;
};

const SIZE_CLASSES: Record<string, { container: string; icon: string; lucideSize: number }> = {
  sm: { container: 'h-10 w-10', icon: 'text-lg', lucideSize: 18 },
  md: { container: 'h-14 w-14', icon: 'text-2xl', lucideSize: 24 },
  lg: { container: 'h-20 w-20', icon: 'text-4xl', lucideSize: 36 },
  xl: { container: 'h-28 w-28', icon: 'text-5xl', lucideSize: 48 },
};

// SVG shape paths
function getShapePath(shape: MedalShape): string {
  switch (shape) {
    case 'shield':
      return 'M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z';
    case 'star':
      return 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';
    case 'hexagon':
      return 'M21 16.05V7.95c0-.49-.25-.94-.67-1.19l-7-4.04a1.33 1.33 0 0 0-1.33 0l-7 4.04c-.41.25-.67.7-.67 1.19v8.1c0 .49.25.94.67 1.19l7 4.04c.42.25.92.25 1.33 0l7-4.04c.42-.25.67-.7.67-1.19z';
    case 'diamond':
      return 'M12 2L2 12l10 10 10-10L12 2z';
    case 'badge':
      return 'M12 2C9.24 2 7 4.24 7 7v3.17l-2.59 2.59L5 14.17V22l7-3 7 3v-7.83l.59-.59L17 10.17V7c0-2.76-2.24-5-5-5z';
    default:
      return '';
  }
}

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
    const FallbackIcon = LucideIcons.Award;
    return <FallbackIcon size={sizeClass.lucideSize} className="text-amber-400" />;
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

  return (
    <Icon
      name={icon}
      fallback="award"
      size={sizeClass.lucideSize}
      className={color ? '' : 'text-current'}
      style={color ? { color } : undefined}
    />
  );
}

export default function MedalBadge({ medal, size = 'md', showTooltip = true }: Props) {
  const sizeClass = SIZE_CLASSES[size];
  const shape = medal.shape || 'circle';
  const bgColor = medal.earned ? (medal.bgColor || '#d946ef20') : '#27272a80';
  const borderColor = medal.earned ? (medal.borderColor || medal.bgColor || '#d946ef') : '#3f3f46';
  const iconColor = medal.earned ? medal.iconColor : '#71717a';
  const glowStyle = medal.earned && medal.glow 
    ? { filter: `drop-shadow(0 0 8px ${borderColor})` } 
    : undefined;

  // Render custom shape with SVG
  if (shape !== 'circle') {
    const path = getShapePath(shape);
    return (
      <div className="group relative">
        <div 
          className={`${sizeClass.container} relative flex items-center justify-center transition-all ${
            !medal.earned ? 'opacity-40 grayscale' : ''
          }`}
          style={glowStyle}
        >
          <svg viewBox="0 0 24 24" className="absolute inset-0 w-full h-full">
            <path
              d={path}
              fill={bgColor}
              stroke={borderColor}
              strokeWidth="0.5"
            />
          </svg>
          <div className="relative z-10">
            {renderIcon(medal.icon, medal.iconType, size, iconColor)}
          </div>
        </div>
        {showTooltip && <MedalTooltip medal={medal} />}
      </div>
    );
  }

  // Default circle shape
  return (
    <div className="group relative">
      <div
        className={`${sizeClass.container} flex items-center justify-center rounded-full border-2 transition-all ${
          medal.earned
            ? medal.glow ? 'shadow-lg' : ''
            : 'opacity-40 grayscale'
        }`}
        style={{
          backgroundColor: bgColor,
          borderColor: borderColor,
          ...(medal.earned && medal.glow ? { boxShadow: `0 0 16px ${borderColor}` } : {}),
        }}
      >
        {renderIcon(medal.icon, medal.iconType, size, iconColor)}
      </div>
      {showTooltip && <MedalTooltip medal={medal} />}
    </div>
  );
}

function MedalTooltip({ medal }: { medal: Medal }) {
  return (
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
  );
}
