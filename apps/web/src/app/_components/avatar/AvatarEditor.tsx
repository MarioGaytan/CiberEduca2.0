'use client';

import { useState, useMemo, useEffect } from 'react';
import DiceBearAvatar, { DiceBearConfig, buildDiceBearUrl } from './DiceBearAvatar';

type AvatarOption = {
  id: string;
  category: string;
  value: string;
  displayName: string;
  requiredXp: number;
  requiredLevel: number;
  isActive: boolean;
};

type AvatarOptionsResponse = {
  unlocked: Record<string, AvatarOption[]>;
  locked: Record<string, AvatarOption[]>;
};

type Props = {
  currentConfig: Partial<DiceBearConfig>;
  username: string;
  userXp: number;
  userLevel: number;
  onSave: (config: Partial<DiceBearConfig>) => Promise<void>;
};

const CATEGORY_LABELS: Record<string, string> = {
  style: '🎨 Estilo',
  skinColor: '👤 Tono de piel',
  backgroundColor: '🖼️ Fondo',
  eyes: '👁️ Ojos',
  mouth: '👄 Boca',
  top: '💇 Cabello',
  accessories: '👓 Accesorios',
};

const CATEGORY_ORDER = ['style', 'skinColor', 'backgroundColor', 'top', 'eyes', 'mouth', 'accessories'];

export default function AvatarEditor({ currentConfig, username, userXp, userLevel, onSave }: Props) {
  const [config, setConfig] = useState<Partial<DiceBearConfig>>(currentConfig);
  const [options, setOptions] = useState<AvatarOptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('style');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchOptions();
  }, [userXp, userLevel]);

  // Sync config when currentConfig changes externally (e.g., after save)
  useEffect(() => {
    setConfig(currentConfig);
    setHasChanges(false);
  }, [JSON.stringify(currentConfig)]);

  async function fetchOptions() {
    try {
      const res = await fetch(`/api/gamification/avatar-options/${userXp}/${userLevel}`);
      if (res.ok) {
        const data = await res.json();
        setOptions(data);
      }
    } catch (e) {
      console.error('Error fetching avatar options:', e);
    } finally {
      setLoading(false);
    }
  }

  function updateConfig(category: string, value: string) {
    const newConfig = { ...config };
    
    // Map category to config key
    switch (category) {
      case 'style':
        newConfig.style = value;
        break;
      case 'skinColor':
        newConfig.skinColor = value;
        break;
      case 'backgroundColor':
        newConfig.backgroundColor = value;
        break;
      case 'eyes':
        newConfig.eyes = value;
        break;
      case 'mouth':
        newConfig.mouth = value;
        break;
      case 'top':
        newConfig.top = value;
        break;
      case 'accessories':
        newConfig.accessories = value === 'none' ? undefined : value;
        break;
    }
    
    setConfig(newConfig);
    setHasChanges(true);
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
    setHasChanges(false);
  }

  const previewUrl = useMemo(() => buildDiceBearUrl(config, username), [config, username]);

  if (loading) {
    return (
      <div className="ce-card p-6 text-center text-zinc-400">
        Cargando opciones de avatar...
      </div>
    );
  }

  if (!options) {
    return (
      <div className="ce-card p-6 text-center text-red-400">
        Error al cargar opciones de avatar
      </div>
    );
  }

  const unlockedCategories = Object.keys(options.unlocked).filter(
    cat => options.unlocked[cat]?.length > 0
  );
  const lockedCategories = Object.keys(options.locked).filter(
    cat => options.locked[cat]?.length > 0
  );

  // Sort categories by defined order
  const sortedCategories = CATEGORY_ORDER.filter(cat => unlockedCategories.includes(cat));

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
              <div className="absolute -top-2 -right-2 bg-fuchsia-500 text-white text-xs px-2 py-1 rounded-full">
                Sin guardar
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold text-zinc-100">Vista previa</h3>
            <p className="text-sm text-zinc-400 mt-1">
              XP: {userXp.toLocaleString()} • Nivel {userLevel}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="ce-btn ce-btn-primary"
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

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {sortedCategories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              activeCategory === category
                ? 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/50'
                : 'bg-zinc-800/50 text-zinc-400 border border-transparent hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            {CATEGORY_LABELS[category] || category}
          </button>
        ))}
      </div>

      {/* Options Grid */}
      <div className="ce-card p-5">
        <h4 className="text-sm font-semibold text-zinc-200 mb-4">
          {CATEGORY_LABELS[activeCategory] || activeCategory}
        </h4>
        
        {/* Unlocked Options */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {options.unlocked[activeCategory]?.map((option) => {
            const isSelected = getConfigValue(config, activeCategory) === option.value ||
              (option.value === 'none' && !getConfigValue(config, activeCategory));
            
            return (
              <button
                key={option.id}
                onClick={() => updateConfig(activeCategory, option.value)}
                className={`group relative p-2 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-fuchsia-500 bg-fuchsia-500/20 scale-105'
                    : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                }`}
              >
                {activeCategory === 'backgroundColor' || activeCategory === 'skinColor' ? (
                  <div
                    className="w-full aspect-square rounded-lg"
                    style={{ backgroundColor: `#${option.value}` }}
                  />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center">
                    <DiceBearAvatar
                      config={getPreviewConfig(config, activeCategory, option.value)}
                      seed={username}
                      size={48}
                    />
                  </div>
                )}
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
              </button>
            );
          })}
        </div>

        {/* Locked Options */}
        {options.locked[activeCategory]?.length > 0 && (
          <div className="mt-6">
            <h5 className="text-xs font-semibold text-zinc-500 mb-3 flex items-center gap-2">
              🔒 Por desbloquear
            </h5>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 opacity-60">
              {options.locked[activeCategory]?.slice(0, 6).map((option) => (
                <div
                  key={option.id}
                  className="relative p-2 rounded-xl border border-white/5 bg-white/5 cursor-not-allowed"
                  title={`Requiere ${option.requiredXp} XP o nivel ${option.requiredLevel}`}
                >
                  {activeCategory === 'backgroundColor' || activeCategory === 'skinColor' ? (
                    <div
                      className="w-full aspect-square rounded-lg grayscale"
                      style={{ backgroundColor: `#${option.value}` }}
                    />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center grayscale">
                      <DiceBearAvatar
                        config={getPreviewConfig(config, activeCategory, option.value)}
                        seed={username}
                        size={48}
                      />
                    </div>
                  )}
                  <div className="mt-2 text-xs text-center text-zinc-500 truncate">
                    {option.displayName}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/60 px-2 py-1 rounded text-xs text-zinc-300">
                      {option.requiredXp} XP
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getConfigValue(config: Partial<DiceBearConfig>, category: string): string | undefined {
  switch (category) {
    case 'style': return config.style;
    case 'skinColor': return config.skinColor;
    case 'backgroundColor': return config.backgroundColor;
    case 'eyes': return config.eyes;
    case 'mouth': return config.mouth;
    case 'top': return config.top;
    case 'accessories': return config.accessories;
    default: return undefined;
  }
}

function getPreviewConfig(
  baseConfig: Partial<DiceBearConfig>,
  category: string,
  value: string
): Partial<DiceBearConfig> {
  const preview = { ...baseConfig };
  switch (category) {
    case 'style': preview.style = value; break;
    case 'skinColor': preview.skinColor = value; break;
    case 'backgroundColor': preview.backgroundColor = value; break;
    case 'eyes': preview.eyes = value; break;
    case 'mouth': preview.mouth = value; break;
    case 'top': preview.top = value; break;
    case 'accessories': preview.accessories = value === 'none' ? undefined : value; break;
  }
  return preview;
}
