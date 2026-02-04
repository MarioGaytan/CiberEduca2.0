'use client';

import Icon from '../ui/Icon';

type AvatarConfig = {
  base?: string;
  color?: string;
  accessories?: string[] | string;
  frame?: string;
  style?: string;
  skinColor?: string;
  backgroundColor?: string;
  top?: string;
  eyes?: string;
  mouth?: string;
};

type Props = {
  avatar?: AvatarConfig;
  username?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFrame?: boolean;
};

const AVATAR_ICONS: Record<string, string> = {
  default: 'smile',
  cool: 'glasses',
  nerd: 'brain',
  ninja: 'sword',
  robot: 'settings-2',
  alien: 'sparkles',
};

const FRAME_STYLES: Record<string, string> = {
  none: '',
  bronze: 'ring-2 ring-amber-600',
  silver: 'ring-2 ring-zinc-400',
  gold: 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-zinc-900',
  diamond: 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-zinc-900 shadow-[0_0_12px_rgba(34,211,238,0.4)]',
  legendary: 'ring-2 ring-fuchsia-400 ring-offset-2 ring-offset-zinc-900 shadow-[0_0_16px_rgba(217,70,239,0.5)] animate-pulse',
};

const SIZE_CLASSES: Record<string, { container: string; icon: string }> = {
  sm: { container: 'h-8 w-8', icon: 'h-4 w-4' },
  md: { container: 'h-12 w-12', icon: 'h-6 w-6' },
  lg: { container: 'h-16 w-16', icon: 'h-8 w-8' },
  xl: { container: 'h-24 w-24', icon: 'h-12 w-12' },
};

export default function StudentAvatar({ avatar, username, size = 'md', showFrame = true }: Props) {
  const base = avatar?.base || 'default';
  const color = avatar?.color || '#6366f1';
  const frame = avatar?.frame || 'none';
  const sizeClass = SIZE_CLASSES[size];
  const frameClass = showFrame ? FRAME_STYLES[frame] || '' : '';
  const iconName = AVATAR_ICONS[base] || 'smile';

  return (
    <div
      className={`${sizeClass.container} ${frameClass} flex items-center justify-center rounded-full transition-all`}
      style={{ backgroundColor: color }}
      title={username}
    >
      <Icon name={iconName} className={`${sizeClass.icon} text-white/90`} />
    </div>
  );
}
