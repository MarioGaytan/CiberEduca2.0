'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { buildDiceBearUrl, DiceBearConfig } from './DiceBearAvatar';

type DiceBearOption = {
  value: string;
  displayName: string;
  requiredXp: number;
  requiredLevel: number;
  isUnlocked: boolean;
};

type DiceBearCategory = {
  name: string;
  displayName: string;
  type: string;
  isColor?: boolean;
  options: DiceBearOption[];
  sortOrder: number;
};

type DiceBearStyleData = {
  styleId: string;
  displayName: string;
  creator: string;
  apiUrl: string;
  isUnlocked: boolean;
  requiredXp: number;
  requiredLevel: number;
  categories: DiceBearCategory[];
};

type StyleSummary = {
  styleId: string;
  displayName: string;
  creator: string;
  apiUrl: string;
  requiredXp: number;
  requiredLevel: number;
  isUnlocked: boolean;
};

type Props = {
  currentConfig: Partial<DiceBearConfig>;
  username: string;
  userXp: number;
  userLevel: number;
  onSave: (config: Partial<DiceBearConfig>) => Promise<void>;
};

const CATEGORY_ICONS: Record<string, string> = {
  skinColor: '👤',
  hair: '💇',
  hairColor: '🎨',
  eyes: '👁️',
  eyebrows: '🤨',
  mouth: '👄',
  glasses: '👓',
  accessories: '✨',
  earrings: '💎',
  clothing: '👕',
  backgroundColor: '🖼️',
  features: '⭐',
  top: '💇',
  facialHair: '🧔',
  nose: '👃',
  beard: '🧔',
  body: '🦴',
  face: '😊',
};

// Lazy loaded image with intersection observer
const LazyImage = memo(function LazyImage({ 
  src, 
  alt, 
  className,
  fallback 
}: { 
  src: string; 
  alt: string; 
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (error && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div ref={imgRef} className={`${className} flex items-center justify-center`}>
      {isInView ? (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-zinc-700/50 animate-pulse rounded" />
      )}
    </div>
  );
});

export default function AvatarEditorV2({ currentConfig, username, userXp, userLevel, onSave }: Props) {
  const [config, setConfig] = useState<Partial<DiceBearConfig>>(currentConfig);
  const [styles, setStyles] = useState<StyleSummary[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>(currentConfig.style || 'avataaars');
  const [styleData, setStyleData] = useState<DiceBearStyleData | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingStyle, setLoadingStyle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch available styles
  useEffect(() => {
    fetchStyles();
  }, [userXp, userLevel]);

  // Fetch style data when selected style changes
  useEffect(() => {
    if (selectedStyle) {
      fetchStyleData(selectedStyle);
    }
  }, [selectedStyle, userXp, userLevel]);

  // Sync config when currentConfig changes externally
  useEffect(() => {
    setConfig(currentConfig);
    setHasChanges(false);
    if (currentConfig.style && currentConfig.style !== selectedStyle) {
      setSelectedStyle(currentConfig.style);
    }
  }, [JSON.stringify(currentConfig)]);

  async function fetchStyles() {
    try {
      const res = await fetch(`/api/gamification/dicebear/styles/user/${userXp}/${userLevel}`);
      if (res.ok) {
        const data = await res.json();
        setStyles(data);
      }
    } catch (e) {
      console.error('Error fetching styles:', e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStyleData(styleId: string) {
    setLoadingStyle(true);
    try {
      const res = await fetch(`/api/gamification/dicebear/styles/${styleId}/user/${userXp}/${userLevel}`);
      if (res.ok) {
        const data = await res.json();
        setStyleData(data);
        // Set first category as active if none selected
        if (!activeCategory && data.categories?.length > 0) {
          setActiveCategory(data.categories[0].name);
        }
      }
    } catch (e) {
      console.error('Error fetching style data:', e);
    } finally {
      setLoadingStyle(false);
    }
  }

  function updateConfig(category: string, value: string) {
    const newConfig = { ...config };
    
    // Handle special cases
    if (value === 'none' || value === '') {
      (newConfig as any)[category] = undefined;
    } else {
      (newConfig as any)[category] = value;
    }
    
    setConfig(newConfig);
    setHasChanges(true);
  }

  function handleStyleChange(styleId: string) {
    const style = styles.find(s => s.styleId === styleId);
    if (!style?.isUnlocked) return;
    
    setSelectedStyle(styleId);
    setConfig(prev => ({ ...prev, style: styleId }));
    setHasChanges(true);
    setActiveCategory(''); // Reset category
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(config);
      setHasChanges(false);
    } catch (e) {
      console.error('Error saving avatar:', e);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setConfig(currentConfig);
    setSelectedStyle(currentConfig.style || 'avataaars');
    setHasChanges(false);
  }

  // Build preview URL
  const previewUrl = buildDiceBearUrl(config, username);

  // Filter categories with options
  const availableCategories = styleData?.categories?.filter(
    cat => cat.options && cat.options.length > 0
  ) || [];

  // Get current category data
  const currentCategory = availableCategories.find(c => c.name === activeCategory);

  if (loading) {
    return (
      <div className="ce-card p-6 text-center text-zinc-400">
        <div className="animate-spin w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full mx-auto mb-3" />
        Cargando editor de avatar...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview Section */}
      <div className="ce-card p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Tu avatar"
              className="w-32 h-32 rounded-full bg-zinc-800 shadow-lg"
            />
            {hasChanges && (
              <div className="absolute -top-2 -right-2 bg-fuchsia-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                Sin guardar
              </div>
            )}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h3 className="text-lg font-semibold text-zinc-100">Vista previa</h3>
            <p className="text-sm text-zinc-400 mt-1">
              XP: {userXp.toLocaleString()} • Nivel {userLevel}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="ce-btn ce-btn-primary disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              {hasChanges && (
                <button onClick={handleReset} className="ce-btn ce-btn-ghost">
                  Descartar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Style Selector */}
      <div className="ce-card p-5">
        <h4 className="text-sm font-semibold text-zinc-200 mb-4">🎨 Estilo de Avatar</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {styles.map((style) => (
            <button
              key={style.styleId}
              onClick={() => handleStyleChange(style.styleId)}
              disabled={!style.isUnlocked}
              className={`relative p-3 rounded-xl border-2 transition-all ${
                selectedStyle === style.styleId
                  ? 'border-fuchsia-500 bg-fuchsia-500/20'
                  : style.isUnlocked
                    ? 'border-white/10 bg-white/5 hover:border-white/30'
                    : 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
              }`}
            >
              <LazyImage
                src={`${style.apiUrl}?seed=${username}&size=64`}
                alt={style.displayName}
                className="w-12 h-12 mx-auto rounded-lg"
              />
              <div className="mt-2 text-xs text-center text-zinc-300 truncate">
                {style.displayName}
              </div>
              {!style.isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <span className="text-xs text-zinc-300 px-2 py-1 bg-black/70 rounded">
                    🔒 {style.requiredXp} XP
                  </span>
                </div>
              )}
              {selectedStyle === style.styleId && (
                <div className="absolute -top-1 -right-1 bg-fuchsia-500 rounded-full p-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      {availableCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
          {availableCategories.map((category) => (
            <button
              key={category.name}
              onClick={() => setActiveCategory(category.name)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
                activeCategory === category.name
                  ? 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/50'
                  : 'bg-zinc-800/50 text-zinc-400 border border-transparent hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {CATEGORY_ICONS[category.name] || '⚙️'} {category.displayName}
            </button>
          ))}
        </div>
      )}

      {/* Options Grid */}
      {loadingStyle ? (
        <div className="ce-card p-6 text-center text-zinc-400">
          <div className="animate-spin w-6 h-6 border-2 border-fuchsia-500 border-t-transparent rounded-full mx-auto mb-2" />
          Cargando opciones...
        </div>
      ) : currentCategory && (
        <div className="ce-card p-5">
          <h4 className="text-sm font-semibold text-zinc-200 mb-4">
            {CATEGORY_ICONS[currentCategory.name] || '⚙️'} {currentCategory.displayName}
          </h4>
          
          {currentCategory.isColor ? (
            // Color picker grid
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {currentCategory.options.map((option) => {
                const isSelected = (config as any)[currentCategory.name] === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => option.isUnlocked && updateConfig(currentCategory.name, option.value)}
                    disabled={!option.isUnlocked}
                    className={`relative aspect-square rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-fuchsia-500 scale-110 shadow-lg'
                        : option.isUnlocked
                          ? 'border-white/20 hover:border-white/50'
                          : 'border-white/10 opacity-40 cursor-not-allowed'
                    }`}
                    style={{ backgroundColor: `#${option.value}` }}
                    title={option.displayName}
                  >
                    {!option.isUnlocked && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs">🔒</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            // Regular options grid with avatar previews
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {currentCategory.options.map((option) => {
                const isSelected = (config as any)[currentCategory.name] === option.value ||
                  (option.value === 'none' && !(config as any)[currentCategory.name]);
                
                const previewConfig = { ...config, [currentCategory.name]: option.value };
                const optionPreviewUrl = buildDiceBearUrl(previewConfig, `preview-${option.value}`);
                
                return (
                  <button
                    key={option.value}
                    onClick={() => option.isUnlocked && updateConfig(currentCategory.name, option.value)}
                    disabled={!option.isUnlocked}
                    className={`group relative p-2 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-fuchsia-500 bg-fuchsia-500/20 scale-105'
                        : option.isUnlocked
                          ? 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                          : 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-full aspect-square ${!option.isUnlocked ? 'grayscale' : ''}`}>
                      <LazyImage
                        src={optionPreviewUrl}
                        alt={option.displayName}
                        className="w-full h-full rounded-lg"
                      />
                    </div>
                    <div className="mt-2 text-xs text-center text-zinc-300 truncate">
                      {option.displayName}
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 bg-fuchsia-500 rounded-full p-1">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {!option.isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-black/70 text-xs px-2 py-1 rounded text-zinc-300">
                          🔒 {option.requiredXp} XP
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
