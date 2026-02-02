'use client';

import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';

// Map of icon names to Lucide components
// This allows dynamic icon rendering by name string
const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  // Awards & Achievements
  trophy: LucideIcons.Trophy,
  medal: LucideIcons.Medal,
  award: LucideIcons.Award,
  crown: LucideIcons.Crown,
  star: LucideIcons.Star,
  sparkles: LucideIcons.Sparkles,
  gem: LucideIcons.Gem,
  zap: LucideIcons.Zap,
  flame: LucideIcons.Flame,
  target: LucideIcons.Target,
  crosshair: LucideIcons.Crosshair,
  
  // Ranking
  'trophy-gold': LucideIcons.Trophy,
  'medal-gold': LucideIcons.Medal,
  'medal-silver': LucideIcons.Medal,
  'medal-bronze': LucideIcons.Medal,
  'circle-1': LucideIcons.CircleDot,
  'circle-2': LucideIcons.Circle,
  'circle-3': LucideIcons.Circle,
  
  // Education
  'graduation-cap': LucideIcons.GraduationCap,
  'book-open': LucideIcons.BookOpen,
  'book-marked': LucideIcons.BookMarked,
  notebook: LucideIcons.Notebook,
  'file-text': LucideIcons.FileText,
  'clipboard-check': LucideIcons.ClipboardCheck,
  'clipboard-list': LucideIcons.ClipboardList,
  brain: LucideIcons.Brain,
  lightbulb: LucideIcons.Lightbulb,
  
  // Progress & Stats
  'trending-up': LucideIcons.TrendingUp,
  'bar-chart': LucideIcons.BarChart3,
  'line-chart': LucideIcons.LineChart,
  activity: LucideIcons.Activity,
  timer: LucideIcons.Timer,
  clock: LucideIcons.Clock,
  calendar: LucideIcons.Calendar,
  'calendar-check': LucideIcons.CalendarCheck,
  
  // User & Profile
  user: LucideIcons.User,
  users: LucideIcons.Users,
  'user-circle': LucideIcons.UserCircle,
  smile: LucideIcons.Smile,
  heart: LucideIcons.Heart,
  
  // Navigation & Actions
  check: LucideIcons.Check,
  'check-circle': LucideIcons.CheckCircle,
  x: LucideIcons.X,
  'x-circle': LucideIcons.XCircle,
  plus: LucideIcons.Plus,
  minus: LucideIcons.Minus,
  edit: LucideIcons.Edit,
  trash: LucideIcons.Trash2,
  save: LucideIcons.Save,
  download: LucideIcons.Download,
  upload: LucideIcons.Upload,
  refresh: LucideIcons.RefreshCw,
  
  // Avatar categories
  palette: LucideIcons.Palette,
  paintbrush: LucideIcons.Paintbrush,
  scissors: LucideIcons.Scissors,
  eye: LucideIcons.Eye,
  'eye-off': LucideIcons.EyeOff,
  glasses: LucideIcons.Glasses,
  shirt: LucideIcons.Shirt,
  image: LucideIcons.Image,
  'image-plus': LucideIcons.ImagePlus,
  brush: LucideIcons.Brush,
  droplet: LucideIcons.Droplet,
  circle: LucideIcons.Circle,
  square: LucideIcons.Square,
  hexagon: LucideIcons.Hexagon,
  
  // Misc
  settings: LucideIcons.Settings,
  'settings-2': LucideIcons.Settings2,
  sliders: LucideIcons.SlidersHorizontal,
  filter: LucideIcons.Filter,
  search: LucideIcons.Search,
  info: LucideIcons.Info,
  'help-circle': LucideIcons.HelpCircle,
  'alert-circle': LucideIcons.AlertCircle,
  'alert-triangle': LucideIcons.AlertTriangle,
  lock: LucideIcons.Lock,
  unlock: LucideIcons.Unlock,
  shield: LucideIcons.Shield,
  'shield-check': LucideIcons.ShieldCheck,
  key: LucideIcons.Key,
  
  // Arrows
  'arrow-up': LucideIcons.ArrowUp,
  'arrow-down': LucideIcons.ArrowDown,
  'arrow-left': LucideIcons.ArrowLeft,
  'arrow-right': LucideIcons.ArrowRight,
  'chevron-up': LucideIcons.ChevronUp,
  'chevron-down': LucideIcons.ChevronDown,
  'chevron-left': LucideIcons.ChevronLeft,
  'chevron-right': LucideIcons.ChevronRight,
  
  // Layout
  home: LucideIcons.Home,
  menu: LucideIcons.Menu,
  grid: LucideIcons.Grid3X3,
  list: LucideIcons.List,
  layout: LucideIcons.Layout,
  layers: LucideIcons.Layers,
  
  // Communication
  'message-circle': LucideIcons.MessageCircle,
  'message-square': LucideIcons.MessageSquare,
  mail: LucideIcons.Mail,
  bell: LucideIcons.Bell,
  'bell-ring': LucideIcons.BellRing,
  
  // Maps & Location
  map: LucideIcons.Map,
  'map-pin': LucideIcons.MapPin,
  compass: LucideIcons.Compass,
  globe: LucideIcons.Globe,
  
  // Special for medals/badges
  rocket: LucideIcons.Rocket,
  'hand-metal': LucideIcons.HandMetal,
  party: LucideIcons.PartyPopper,
  confetti: LucideIcons.PartyPopper,
  gift: LucideIcons.Gift,
  cake: LucideIcons.Cake,
  'thumbs-up': LucideIcons.ThumbsUp,
  'thumbs-down': LucideIcons.ThumbsDown,
  swords: LucideIcons.Swords,
  sword: LucideIcons.Sword,
  wand: LucideIcons.Wand2,
  magic: LucideIcons.Wand2,
  bolt: LucideIcons.Zap,
  fire: LucideIcons.Flame,
  snowflake: LucideIcons.Snowflake,
  sun: LucideIcons.Sun,
  moon: LucideIcons.Moon,
  cloud: LucideIcons.Cloud,
  rainbow: LucideIcons.Rainbow,
  music: LucideIcons.Music,
  gamepad: LucideIcons.Gamepad2,
  puzzle: LucideIcons.Puzzle,
  dumbbell: LucideIcons.Dumbbell,
  bicep: LucideIcons.Dumbbell,
};

export interface IconProps extends Omit<LucideProps, 'ref'> {
  name: string;
  fallback?: string;
}

export default function Icon({ name, fallback = 'circle', className, ...props }: IconProps) {
  const IconComponent = iconMap[name.toLowerCase()] || iconMap[fallback.toLowerCase()] || LucideIcons.Circle;
  
  return <IconComponent className={className} {...props} />;
}

// Export icon names for autocomplete and validation
export const ICON_NAMES = Object.keys(iconMap);

// Utility to check if icon exists
export function iconExists(name: string): boolean {
  return name.toLowerCase() in iconMap;
}

// Get all icons grouped by category
export const ICON_CATEGORIES = {
  awards: ['trophy', 'medal', 'award', 'crown', 'star', 'sparkles', 'gem', 'zap', 'flame', 'target'],
  education: ['graduation-cap', 'book-open', 'book-marked', 'notebook', 'file-text', 'clipboard-check', 'brain', 'lightbulb'],
  progress: ['trending-up', 'bar-chart', 'line-chart', 'activity', 'timer', 'clock', 'calendar'],
  user: ['user', 'users', 'user-circle', 'smile', 'heart'],
  actions: ['check', 'check-circle', 'x', 'x-circle', 'plus', 'minus', 'edit', 'trash', 'save'],
  avatar: ['palette', 'paintbrush', 'scissors', 'eye', 'glasses', 'shirt', 'image', 'brush', 'droplet'],
  special: ['rocket', 'party', 'gift', 'swords', 'wand', 'fire', 'bolt', 'gamepad', 'puzzle', 'dumbbell'],
};
