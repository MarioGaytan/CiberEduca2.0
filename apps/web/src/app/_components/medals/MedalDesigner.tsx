'use client';

import { useState, useMemo } from 'react';
import Icon, { ICON_MAP, type IconName } from '../ui/Icon';
import { Search, RotateCcw } from 'lucide-react';

// Medal shape types
export type MedalShape = 'circle' | 'shield' | 'star' | 'hexagon' | 'diamond' | 'badge';

// Medal design configuration
export type MedalDesign = {
  shape: MedalShape;
  icon: IconName;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  borderWidth: number;
  size: 'sm' | 'md' | 'lg' | 'xl';
  glow: boolean;
  glowColor?: string;
};

// Default design
export const DEFAULT_MEDAL_DESIGN: MedalDesign = {
  shape: 'circle',
  icon: 'Trophy',
  iconColor: '#fbbf24',
  bgColor: '#fbbf2420',
  borderColor: '#fbbf24',
  borderWidth: 2,
  size: 'lg',
  glow: false,
};

// Preset color palettes
const COLOR_PALETTES = {
  gold: { iconColor: '#fbbf24', bgColor: '#fbbf2420', borderColor: '#fbbf24' },
  silver: { iconColor: '#a3a3a3', bgColor: '#a3a3a320', borderColor: '#a3a3a3' },
  bronze: { iconColor: '#cd7f32', bgColor: '#cd7f3220', borderColor: '#cd7f32' },
  ruby: { iconColor: '#ef4444', bgColor: '#ef444420', borderColor: '#ef4444' },
  emerald: { iconColor: '#10b981', bgColor: '#10b98120', borderColor: '#10b981' },
  sapphire: { iconColor: '#3b82f6', bgColor: '#3b82f620', borderColor: '#3b82f6' },
  amethyst: { iconColor: '#a855f7', bgColor: '#a855f720', borderColor: '#a855f7' },
  rose: { iconColor: '#f472b6', bgColor: '#f472b620', borderColor: '#f472b6' },
  cyan: { iconColor: '#22d3ee', bgColor: '#22d3ee20', borderColor: '#22d3ee' },
  orange: { iconColor: '#f97316', bgColor: '#f9731620', borderColor: '#f97316' },
};

// Size configurations
const SIZE_CONFIG = {
  sm: { container: 'w-8 h-8', icon: 'h-4 w-4' },
  md: { container: 'w-12 h-12', icon: 'h-6 w-6' },
  lg: { container: 'w-16 h-16', icon: 'h-8 w-8' },
  xl: { container: 'w-24 h-24', icon: 'h-12 w-12' },
};

// SVG shape paths
function getShapePath(shape: MedalShape): string {
  switch (shape) {
    case 'circle':
      return '';
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

// Medal Preview Component
export function MedalPreview({ design, className = '' }: { design: MedalDesign; className?: string }) {
  const sizeConfig = SIZE_CONFIG[design.size];
  
  const containerStyle: React.CSSProperties = {
    backgroundColor: design.bgColor,
    borderColor: design.borderColor,
    borderWidth: design.borderWidth,
    boxShadow: design.glow ? `0 0 20px ${design.glowColor || design.borderColor}` : undefined,
  };

  if (design.shape === 'circle') {
    return (
      <div
        className={`${sizeConfig.container} rounded-full border flex items-center justify-center transition-all ${className}`}
        style={containerStyle}
      >
        <Icon name={design.icon} className={sizeConfig.icon} style={{ color: design.iconColor }} />
      </div>
    );
  }

  // For custom shapes, use SVG
  const path = getShapePath(design.shape);
  const viewBox = '0 0 24 24';
  
  return (
    <div className={`${sizeConfig.container} relative flex items-center justify-center ${className}`}>
      <svg
        viewBox={viewBox}
        className="absolute inset-0 w-full h-full"
        style={{ filter: design.glow ? `drop-shadow(0 0 8px ${design.glowColor || design.borderColor})` : undefined }}
      >
        <path
          d={path}
          fill={design.bgColor}
          stroke={design.borderColor}
          strokeWidth={design.borderWidth * 0.15}
        />
      </svg>
      <Icon 
        name={design.icon} 
        className={`${sizeConfig.icon} relative z-10`} 
        style={{ color: design.iconColor }} 
      />
    </div>
  );
}

// Icon categories for easier browsing
const ICON_CATEGORIES = {
  'Logros': ['Trophy', 'Medal', 'Award', 'Crown', 'Star', 'Sparkles', 'Gem', 'Diamond'],
  'Progreso': ['Target', 'Flame', 'Zap', 'TrendingUp', 'Rocket', 'CheckCircle', 'Flag', 'Milestone'],
  'Educación': ['BookOpen', 'GraduationCap', 'Brain', 'Lightbulb', 'Puzzle', 'FileText', 'PenTool'],
  'Social': ['Users', 'UserPlus', 'Heart', 'ThumbsUp', 'MessageCircle', 'Share2'],
  'Tiempo': ['Clock', 'Calendar', 'Timer', 'Hourglass', 'History'],
  'Misc': ['Shield', 'Lock', 'Unlock', 'Key', 'Compass', 'Map', 'Globe', 'Dumbbell'],
} as const;

type Props = {
  initialDesign?: Partial<MedalDesign>;
  onChange?: (design: MedalDesign) => void;
  onSave?: (design: MedalDesign) => void;
  showPreviewSizes?: boolean;
};

export default function MedalDesigner({ 
  initialDesign, 
  onChange, 
  onSave,
  showPreviewSizes = true 
}: Props) {
  const [design, setDesign] = useState<MedalDesign>({
    ...DEFAULT_MEDAL_DESIGN,
    ...initialDesign,
  });
  
  const [iconSearch, setIconSearch] = useState('');
  const [activeIconCategory, setActiveIconCategory] = useState<keyof typeof ICON_CATEGORIES | 'all'>('Logros');

  // Update design and notify parent
  const updateDesign = (updates: Partial<MedalDesign>) => {
    const newDesign = { ...design, ...updates };
    setDesign(newDesign);
    onChange?.(newDesign);
  };

  // Apply color palette
  const applyPalette = (palette: keyof typeof COLOR_PALETTES) => {
    updateDesign(COLOR_PALETTES[palette]);
  };

  // Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    const allIconNames = Object.keys(ICON_MAP) as IconName[];
    
    let icons: IconName[];
    if (activeIconCategory === 'all') {
      icons = allIconNames;
    } else {
      icons = ICON_CATEGORIES[activeIconCategory] as unknown as IconName[];
    }
    
    if (iconSearch) {
      const search = iconSearch.toLowerCase();
      icons = icons.filter(name => name.toLowerCase().includes(search));
    }
    
    return icons;
  }, [activeIconCategory, iconSearch]);

  return (
    <div className="space-y-6">
      {/* Live Preview */}
      <div className="ce-card p-6 bg-gradient-to-br from-zinc-900 to-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-200 mb-4">Vista Previa</h3>
        <div className="flex items-center justify-center gap-8">
          {showPreviewSizes ? (
            <>
              <div className="text-center">
                <MedalPreview design={{ ...design, size: 'sm' }} />
                <span className="text-xs text-zinc-500 mt-2 block">SM</span>
              </div>
              <div className="text-center">
                <MedalPreview design={{ ...design, size: 'md' }} />
                <span className="text-xs text-zinc-500 mt-2 block">MD</span>
              </div>
              <div className="text-center">
                <MedalPreview design={{ ...design, size: 'lg' }} />
                <span className="text-xs text-zinc-500 mt-2 block">LG</span>
              </div>
              <div className="text-center">
                <MedalPreview design={{ ...design, size: 'xl' }} />
                <span className="text-xs text-zinc-500 mt-2 block">XL</span>
              </div>
            </>
          ) : (
            <MedalPreview design={design} />
          )}
        </div>
      </div>

      {/* Shape Selector */}
      <div className="ce-card p-5">
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">Forma</h3>
        <div className="grid grid-cols-6 gap-2">
          {(['circle', 'shield', 'star', 'hexagon', 'diamond', 'badge'] as MedalShape[]).map((shape) => (
            <button
              key={shape}
              onClick={() => updateDesign({ shape })}
              className={`p-3 rounded-xl border transition-all ${
                design.shape === shape
                  ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-200'
                  : 'bg-zinc-800/50 border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <MedalPreview 
                design={{ ...DEFAULT_MEDAL_DESIGN, shape, size: 'sm', iconColor: design.shape === shape ? '#e879f9' : '#a1a1aa' }} 
                className="mx-auto"
              />
              <span className="text-xs mt-1 block capitalize">{shape}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color Palettes */}
      <div className="ce-card p-5">
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">Paleta de Colores</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(COLOR_PALETTES) as (keyof typeof COLOR_PALETTES)[]).map((palette) => (
            <button
              key={palette}
              onClick={() => applyPalette(palette)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{ 
                backgroundColor: COLOR_PALETTES[palette].bgColor,
                color: COLOR_PALETTES[palette].iconColor,
                border: `1px solid ${COLOR_PALETTES[palette].borderColor}`
              }}
            >
              {palette.charAt(0).toUpperCase() + palette.slice(1)}
            </button>
          ))}
        </div>

        {/* Custom Colors */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Color Icono</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={design.iconColor}
                onChange={(e) => updateDesign({ iconColor: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border-0"
              />
              <input
                type="text"
                value={design.iconColor}
                onChange={(e) => updateDesign({ iconColor: e.target.value })}
                className="flex-1 bg-zinc-800 rounded-lg px-3 text-sm text-zinc-200 border border-zinc-700"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Color Fondo</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={design.bgColor.replace(/[0-9a-f]{2}$/i, '')}
                onChange={(e) => updateDesign({ bgColor: e.target.value + '20' })}
                className="w-10 h-10 rounded-lg cursor-pointer border-0"
              />
              <input
                type="text"
                value={design.bgColor}
                onChange={(e) => updateDesign({ bgColor: e.target.value })}
                className="flex-1 bg-zinc-800 rounded-lg px-3 text-sm text-zinc-200 border border-zinc-700"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Color Borde</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={design.borderColor}
                onChange={(e) => updateDesign({ borderColor: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border-0"
              />
              <input
                type="text"
                value={design.borderColor}
                onChange={(e) => updateDesign({ borderColor: e.target.value })}
                className="flex-1 bg-zinc-800 rounded-lg px-3 text-sm text-zinc-200 border border-zinc-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Icon Selector */}
      <div className="ce-card p-5">
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">Icono</h3>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={iconSearch}
            onChange={(e) => setIconSearch(e.target.value)}
            placeholder="Buscar icono..."
            className="w-full bg-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 border border-zinc-700 focus:border-fuchsia-500/50 focus:outline-none"
          />
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1 mb-3">
          <button
            onClick={() => setActiveIconCategory('all')}
            className={`px-2 py-1 text-xs rounded-lg transition-colors ${
              activeIconCategory === 'all'
                ? 'bg-fuchsia-500/20 text-fuchsia-200'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos
          </button>
          {Object.keys(ICON_CATEGORIES).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveIconCategory(cat as keyof typeof ICON_CATEGORIES)}
              className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                activeIconCategory === cat
                  ? 'bg-fuchsia-500/20 text-fuchsia-200'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Icons grid */}
        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1 max-h-48 overflow-y-auto">
          {filteredIcons.map((iconName) => (
            <button
              key={iconName}
              onClick={() => updateDesign({ icon: iconName })}
              title={iconName}
              className={`p-2 rounded-lg transition-all ${
                design.icon === iconName
                  ? 'bg-fuchsia-500/20 text-fuchsia-200 ring-1 ring-fuchsia-500/50'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Icon name={iconName} className="h-5 w-5 mx-auto" />
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Options */}
      <div className="ce-card p-5">
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">Opciones Avanzadas</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Border Width */}
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Grosor del Borde</label>
            <input
              type="range"
              min="0"
              max="6"
              step="0.5"
              value={design.borderWidth}
              onChange={(e) => updateDesign({ borderWidth: parseFloat(e.target.value) })}
              className="w-full accent-fuchsia-500"
            />
            <span className="text-xs text-zinc-500">{design.borderWidth}px</span>
          </div>

          {/* Glow Effect */}
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Efecto de Brillo</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateDesign({ glow: !design.glow })}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  design.glow
                    ? 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/50'
                    : 'bg-zinc-800 text-zinc-400 border border-transparent'
                }`}
              >
                {design.glow ? 'Activado' : 'Desactivado'}
              </button>
              {design.glow && (
                <input
                  type="color"
                  value={design.glowColor || design.borderColor}
                  onChange={(e) => updateDesign({ glowColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setDesign({ ...DEFAULT_MEDAL_DESIGN })}
          className="ce-btn flex items-center gap-2 text-zinc-400 hover:text-zinc-200"
        >
          <RotateCcw className="h-4 w-4" />
          Resetear
        </button>
        {onSave && (
          <button
            onClick={() => onSave(design)}
            className="ce-btn ce-btn-primary flex-1"
          >
            Guardar Diseño
          </button>
        )}
      </div>
    </div>
  );
}
