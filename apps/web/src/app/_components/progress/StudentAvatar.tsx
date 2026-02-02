'use client';

type AvatarConfig = {
  base: string;
  color: string;
  accessories: string[];
  frame: string;
};

type Props = {
  avatar?: AvatarConfig;
  username?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFrame?: boolean;
};

const AVATAR_EMOJIS: Record<string, string> = {
  default: '😊',
  cool: '😎',
  nerd: '🤓',
  ninja: '🥷',
  robot: '🤖',
  alien: '👽',
};

const FRAME_STYLES: Record<string, string> = {
  none: '',
  bronze: 'ring-2 ring-amber-600',
  silver: 'ring-2 ring-zinc-400',
  gold: 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-zinc-900',
  diamond: 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-zinc-900 shadow-[0_0_12px_rgba(34,211,238,0.4)]',
  legendary: 'ring-2 ring-fuchsia-400 ring-offset-2 ring-offset-zinc-900 shadow-[0_0_16px_rgba(217,70,239,0.5)] animate-pulse',
};

const SIZE_CLASSES: Record<string, { container: string; emoji: string }> = {
  sm: { container: 'h-8 w-8', emoji: 'text-lg' },
  md: { container: 'h-12 w-12', emoji: 'text-2xl' },
  lg: { container: 'h-16 w-16', emoji: 'text-3xl' },
  xl: { container: 'h-24 w-24', emoji: 'text-5xl' },
};

export default function StudentAvatar({ avatar, username, size = 'md', showFrame = true }: Props) {
  const config = avatar || { base: 'default', color: '#6366f1', accessories: [], frame: 'none' };
  const sizeClass = SIZE_CLASSES[size];
  const frameClass = showFrame ? FRAME_STYLES[config.frame] || '' : '';
  const emoji = AVATAR_EMOJIS[config.base] || '😊';

  return (
    <div
      className={`${sizeClass.container} ${frameClass} flex items-center justify-center rounded-full transition-all`}
      style={{ backgroundColor: config.color }}
      title={username}
    >
      <span className={sizeClass.emoji}>{emoji}</span>
    </div>
  );
}
