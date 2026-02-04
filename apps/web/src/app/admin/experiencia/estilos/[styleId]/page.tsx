'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  User, Scissors, Palette, Eye, Sparkles, Glasses, Gem, Shirt, Image, Star, 
  Settings, Square, Hexagon, Grid3X3, Smile, Hand, RefreshCw, Package, MapPin,
  Shuffle, CircleDot, Layers, Check
} from 'lucide-react';

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
  min?: number;
  max?: number;
  sortOrder: number;
};

type StyleDetail = {
  styleId: string;
  displayName: string;
  description?: string;
  creator: string;
  license: string;
  styleCategory: string;
  apiUrl: string;
  categories: DiceBearCategory[];
  isUnlocked: boolean;
  requiredXp: number;
  requiredLevel: number;
};

type EditingOption = {
  category: string;
  value: string;
  displayName: string;
  requiredXp: number;
  requiredLevel: number;
};

export default function StyleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const styleId = params?.styleId as string;

  const [style, setStyle] = useState<StyleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Style unlock requirements
  const [styleXp, setStyleXp] = useState(0);
  const [styleLevel, setStyleLevel] = useState(0);
  
  // Active category tab
  const [activeCategory, setActiveCategory] = useState<string>('');
  
  // Editing option
  const [editingOption, setEditingOption] = useState<EditingOption | null>(null);
  
  // Bulk edit mode
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkChanges, setBulkChanges] = useState<Map<string, { xp: number; level: number }>>(new Map());

  useEffect(() => {
    if (styleId) {
      fetchStyleDetail();
    }
  }, [styleId]);

  // Ensure activeCategory is always valid when style data changes
  useEffect(() => {
    if (style && style.categories) {
      const categoriesWithOpts = style.categories.filter(c => c.options && c.options.length > 0);
      const isCurrentValid = categoriesWithOpts.some(c => c.name === activeCategory);
      
      if (!isCurrentValid && categoriesWithOpts.length > 0) {
        setActiveCategory(categoriesWithOpts[0].name);
      }
    }
  }, [style, activeCategory]);

  async function fetchStyleDetail() {
    setLoading(true);
    setError(null);
    try {
      // Fetch with high XP/level to see all options
      const res = await fetch(`/api/gamification/dicebear/styles/${styleId}/user/999999/999`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Estilo no encontrado');
        } else {
          throw new Error('Error al cargar el estilo');
        }
        return;
      }
      const data = await res.json();
      setStyle(data);
      setStyleXp(data.requiredXp || 0);
      setStyleLevel(data.requiredLevel || 0);
      
      // Set first category as active
      if (data.categories?.length > 0) {
        const firstWithOptions = data.categories.find((c: DiceBearCategory) => c.options?.length > 0);
        if (firstWithOptions) {
          setActiveCategory(firstWithOptions.name);
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveStyleUnlock() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/gamification/avatar-configs/${styleId}/unlock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requiredXp: styleXp, requiredLevel: styleLevel }),
      });
      if (!res.ok) throw new Error('Error al guardar requisitos del estilo');
      setSuccess('Requisitos del estilo guardados');
      await fetchStyleDetail();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveOptionUnlock(option: EditingOption) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/gamification/avatar-configs/${styleId}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configs: [{
            category: option.category,
            optionValue: option.value,
            displayName: option.displayName,
            requiredXp: option.requiredXp,
            requiredLevel: option.requiredLevel,
          }],
        }),
      });
      if (!res.ok) throw new Error('Error al guardar requisitos de la opción');
      setSuccess(`Requisitos de "${option.displayName}" guardados`);
      setEditingOption(null);
      await fetchStyleDetail();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveBulkChanges() {
    if (bulkChanges.size === 0) return;
    
    setSaving(true);
    setError(null);
    try {
      const currentCategory = style?.categories.find(c => c.name === activeCategory);
      if (!currentCategory) return;
      
      const configs = Array.from(bulkChanges.entries()).map(([key, value]) => {
        const option = currentCategory.options.find(o => `${activeCategory}_${o.value}` === key);
        return {
          category: activeCategory,
          optionValue: option?.value || '',
          displayName: option?.displayName || '',
          requiredXp: value.xp,
          requiredLevel: value.level,
        };
      }).filter(c => c.optionValue);

      const res = await fetch(`/api/gamification/avatar-configs/${styleId}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs }),
      });
      
      if (!res.ok) throw new Error('Error al guardar cambios en lote');
      setSuccess(`${configs.length} opciones actualizadas`);
      setBulkChanges(new Map());
      setBulkEditMode(false);
      await fetchStyleDetail();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleBulkChange(optionValue: string, field: 'xp' | 'level', value: number) {
    const key = `${activeCategory}_${optionValue}`;
    const current = bulkChanges.get(key) || { xp: 0, level: 0 };
    const updated = { ...current, [field]: value };
    setBulkChanges(new Map(bulkChanges).set(key, updated));
  }

  // Get preview URL for option - DiceBear uses array syntax for most parameters
  function getOptionPreviewUrl(category: string, value: string): string {
    const baseUrl = style?.apiUrl || `https://api.dicebear.com/9.x/${styleId}/svg`;
    // Use unique seed per option so each preview looks different
    let url = `${baseUrl}?seed=${encodeURIComponent(`${category}_${value}`)}&size=80`;
    
    if (value && value !== 'none') {
      // DiceBear expects array syntax for most fields: category[]=value
      url += `&${category}[]=${encodeURIComponent(value)}`;
      // For optional features, set probability to 100 to ensure they show
      if (['accessories', 'glasses', 'earrings', 'facialHair', 'beard', 'hat', 'mask', 'features'].includes(category)) {
        url += `&${category}Probability=100`;
      }
    }
    return url;
  }

  // Get display name for category with fallback
  function getCategoryDisplayName(cat: DiceBearCategory): string {
    if (cat.displayName && cat.displayName.trim()) return cat.displayName;
    // Fallback: convert camelCase to readable format
    return cat.name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  // Map category names to Lucide icon components
  const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    // Face & Head
    skinColor: User, face: Smile, head: User, cheeks: Smile, freckles: Sparkles,
    // Hair
    hair: Scissors, hairColor: Palette, top: Scissors, hairProbability: Scissors,
    // Eyes
    eyes: Eye, eyebrows: Eye, eyeColor: Eye, eyesColor: Eye, eyesShadow: Eye,
    // Mouth & Nose
    mouth: User, mouthColor: Palette, nose: User, noseColor: Palette, lips: User, lipColor: Palette,
    // Facial Hair
    facialHair: User, facialHairColor: Palette, beard: User, beardColor: Palette,
    // Accessories
    glasses: Glasses, glassesProbability: Glasses, accessories: Sparkles, accessoriesColor: Palette,
    earrings: Gem, earringsProbability: Gem, hat: User, hatColor: Palette, hatProbability: User,
    mask: User, spectacles: Glasses,
    // Body & Clothing
    body: User, bodyColor: Palette, clothing: Shirt, clothingColor: Palette, clothingGraphic: Palette,
    shirt: Shirt, shirtColor: Palette,
    // Background & Style
    backgroundColor: Image, backgroundType: Image, backgroundRotation: RefreshCw,
    // Emotions & Gestures
    emotion: Smile, gesture: Hand, features: Star, featuresProbability: Star,
    // Colors
    primaryColor: Palette, secondaryColor: Palette, tertiaryColor: Palette, baseColor: Palette,
    cheeksColor: Palette, frecklesColor: Palette, blush: Smile, blushColor: Palette,
    // Special
    base: Package, shape: Hexagon, shapeColor: Palette, pattern: Grid3X3, texture: Layers,
    icon: MapPin, variant: Shuffle, style: Palette,
    // Grid-based (identicon, etc)
    row1: Grid3X3, row2: Grid3X3, row3: Grid3X3, row4: Grid3X3, row5: Grid3X3, sides: RefreshCw,
    // Misc
    mole: CircleDot, moleProbability: CircleDot, smile: Smile, smileProbability: Smile,
    sideburn: User, sideburnProbability: User, wrinkles: User, wrinklesProbability: User,
    tatoos: Palette, tatoosProbability: Palette, flip: RefreshCw,
  };

  function CategoryIcon({ name, className = 'h-4 w-4' }: { name: string; className?: string }) {
    const IconComponent = CATEGORY_ICON_MAP[name] || Settings;
    return <IconComponent className={className} />;
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="ce-card p-8 text-center">
          <div className="animate-spin w-10 h-10 border-3 border-fuchsia-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-zinc-400">Cargando estilo...</p>
        </div>
      </div>
    );
  }

  if (error && !style) {
    return (
      <div className="p-6">
        <div className="ce-card p-8 text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <Link href="/admin/experiencia" className="ce-btn ce-btn-ghost">
            ← Volver a Estilos
          </Link>
        </div>
      </div>
    );
  }

  if (!style) return null;

  const categoriesWithOptions = style.categories.filter(c => c.options && c.options.length > 0);
  const currentCategoryData = style.categories.find(c => c.name === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link 
            href="/admin/experiencia"
            className="mt-1 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <img
            src={`${style.apiUrl}?seed=preview&size=96`}
            alt={style.displayName}
            className="w-24 h-24 rounded-2xl bg-zinc-800 shadow-xl"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="ce-chip text-xs">
                {style.styleCategory === 'characters' ? 'Personajes' : 'Minimalista'}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-zinc-100">{style.displayName}</h1>
            <p className="text-sm text-zinc-400">por {style.creator}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {style.categories.length} categorías • {style.categories.reduce((sum, c) => sum + c.options.length, 0)} opciones
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          {success}
          <button onClick={() => setSuccess(null)} className="ml-2 text-green-400 hover:text-green-300">×</button>
        </div>
      )}

      {/* Style Unlock Requirements */}
      <div className="ce-card p-5">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">🔓 Requisitos para Desbloquear el Estilo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">XP Requerido</label>
            <input
              type="number"
              value={styleXp}
              onChange={(e) => setStyleXp(parseInt(e.target.value) || 0)}
              min={0}
              className="ce-field"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Nivel Requerido</label>
            <input
              type="number"
              value={styleLevel}
              onChange={(e) => setStyleLevel(parseInt(e.target.value) || 0)}
              min={0}
              className="ce-field"
            />
          </div>
          <div>
            <button
              onClick={saveStyleUnlock}
              disabled={saving}
              className="ce-btn ce-btn-primary w-full"
            >
              {saving ? 'Guardando...' : 'Guardar Requisitos'}
            </button>
          </div>
          <div className="text-sm">
            {styleXp === 0 && styleLevel === 0 ? (
              <span className="text-green-400">Disponible desde el inicio</span>
            ) : (
              <span className="text-fuchsia-300">{styleXp.toLocaleString()} XP, Nivel {styleLevel}</span>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
        {categoriesWithOptions.map((category, idx) => (
          <button
            key={`cat-${category.name}-${idx}`}
            onClick={() => setActiveCategory(category.name)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
              activeCategory === category.name
                ? 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/50 shadow-lg shadow-fuchsia-500/20'
                : 'bg-zinc-800/50 text-zinc-400 border border-transparent hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <CategoryIcon name={category.name} className="h-4 w-4" /> {getCategoryDisplayName(category)}
            <span className="ml-2 text-xs opacity-60">({category.options.length})</span>
          </button>
        ))}
      </div>

      {/* Category Options */}
      {currentCategoryData && (
        <div className="ce-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
              <CategoryIcon name={currentCategoryData.name} className="h-5 w-5" /> {getCategoryDisplayName(currentCategoryData)}
            </h3>
            <div className="flex gap-2">
              {bulkEditMode ? (
                <>
                  <button
                    onClick={saveBulkChanges}
                    disabled={saving || bulkChanges.size === 0}
                    className="ce-btn ce-btn-primary text-sm"
                  >
                    {saving ? 'Guardando...' : `Guardar ${bulkChanges.size} cambios`}
                  </button>
                  <button
                    onClick={() => { setBulkEditMode(false); setBulkChanges(new Map()); }}
                    className="ce-btn ce-btn-ghost text-sm"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setBulkEditMode(true)}
                  className="ce-btn ce-btn-ghost text-sm"
                >
                  Edición en Lote
                </button>
              )}
            </div>
          </div>

          {currentCategoryData.isColor ? (
            /* Color Options Grid */
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {currentCategoryData.options.map((option, optIdx) => (
                <div
                  key={`color-${currentCategoryData.name}-${option.value}-${optIdx}`}
                  className="relative group"
                >
                  <button
                    onClick={() => !bulkEditMode && setEditingOption({
                      category: currentCategoryData.name,
                      value: option.value,
                      displayName: option.displayName,
                      requiredXp: option.requiredXp,
                      requiredLevel: option.requiredLevel,
                    })}
                    className="w-full aspect-square rounded-xl border-2 border-white/10 hover:border-white/30 transition-all hover:scale-105"
                    style={{ backgroundColor: `#${option.value}` }}
                    title={`${option.displayName}\nXP: ${option.requiredXp} | Nivel: ${option.requiredLevel}`}
                  />
                  <div className={`absolute -bottom-1 -right-1 text-xs px-1.5 py-0.5 rounded-full ${
                    option.requiredXp === 0 && option.requiredLevel === 0
                      ? 'bg-green-500/80 text-white'
                      : 'bg-fuchsia-500/80 text-white'
                  }`}>
                    {option.requiredXp === 0 && option.requiredLevel === 0 ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      option.requiredXp
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Regular Options Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {currentCategoryData.options.map((option, optIdx) => {
                const bulkKey = `${currentCategoryData.name}_${option.value}`;
                const bulkEdit = bulkChanges.get(bulkKey);
                
                return (
                  <div
                    key={`opt-${currentCategoryData.name}-${option.value}-${optIdx}`}
                    className="ce-card p-3 hover:border-fuchsia-500/30 transition-all"
                  >
                    <div className="aspect-square mb-2 rounded-lg overflow-hidden bg-zinc-800">
                      <img
                        src={getOptionPreviewUrl(currentCategoryData.name, option.value)}
                        alt={option.displayName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-zinc-200 truncate" title={option.displayName}>
                        {option.displayName}
                      </p>
                      
                      {bulkEditMode ? (
                        <div className="mt-2 space-y-1">
                          <input
                            type="number"
                            placeholder="XP"
                            defaultValue={option.requiredXp}
                            onChange={(e) => handleBulkChange(option.value, 'xp', parseInt(e.target.value) || 0)}
                            className="ce-field text-xs py-1"
                            min={0}
                          />
                          <input
                            type="number"
                            placeholder="Nivel"
                            defaultValue={option.requiredLevel}
                            onChange={(e) => handleBulkChange(option.value, 'level', parseInt(e.target.value) || 0)}
                            className="ce-field text-xs py-1"
                            min={0}
                          />
                        </div>
                      ) : (
                        <>
                          <p className={`text-xs mt-1 ${
                            option.requiredXp === 0 && option.requiredLevel === 0
                              ? 'text-green-400'
                              : 'text-fuchsia-300'
                          }`}>
                            {option.requiredXp === 0 && option.requiredLevel === 0
                              ? 'Gratis'
                              : `${option.requiredXp} XP • Nv.${option.requiredLevel}`}
                          </p>
                          <button
                            onClick={() => setEditingOption({
                              category: currentCategoryData.name,
                              value: option.value,
                              displayName: option.displayName,
                              requiredXp: option.requiredXp,
                              requiredLevel: option.requiredLevel,
                            })}
                            className="mt-2 text-xs text-cyan-400 hover:text-cyan-300"
                          >
                            Editar requisitos
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Option Modal */}
      {editingOption && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="ce-card p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">
              Editar: {editingOption.displayName}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">XP Requerido</label>
                <input
                  type="number"
                  value={editingOption.requiredXp}
                  onChange={(e) => setEditingOption({
                    ...editingOption,
                    requiredXp: parseInt(e.target.value) || 0,
                  })}
                  min={0}
                  className="ce-field"
                />
                <p className="text-xs text-zinc-500 mt-1">0 = disponible gratis</p>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Nivel Requerido</label>
                <input
                  type="number"
                  value={editingOption.requiredLevel}
                  onChange={(e) => setEditingOption({
                    ...editingOption,
                    requiredLevel: parseInt(e.target.value) || 0,
                  })}
                  min={0}
                  className="ce-field"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => saveOptionUnlock(editingOption)}
                disabled={saving}
                className="ce-btn ce-btn-primary flex-1"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => setEditingOption(null)}
                className="ce-btn ce-btn-ghost"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
