'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Star, BarChart3, Medal, Palette, Plus, Edit2, Trash2, X, GripVertical, Download, Upload } from 'lucide-react';
import MedalBadge from '../../_components/progress/MedalBadge';
import MedalDesigner, { MedalDesign, MedalPreview } from '../../_components/medals/MedalDesigner';

type XpRules = {
  testBaseXp: number;
  testPointMultiplier: number;
  testPerfectBonus: number;
  workshopCompletionXp: number;
  dailyStreakXp: number;
  weeklyStreakBonus: number;
  monthlyStreakBonus: number;
};

type LevelConfig = {
  baseXpPerLevel: number;
  levelMultiplier: number;
  maxLevel: number;
};

type MedalShape = 'circle' | 'shield' | 'star' | 'hexagon' | 'diamond' | 'badge';

type MedalDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconType?: 'emoji' | 'lucide' | 'svg';
  iconColor?: string;
  bgColor?: string;
  borderColor?: string;
  shape?: MedalShape;
  glow?: boolean;
  xpReward: number;
  conditionType: string;
  conditionValue: number;
  conditionOperator?: string;
  isActive: boolean;
  sortOrder: number;
};

type AvatarOptionDefinition = {
  id: string;
  category: string;
  value: string;
  displayName: string;
  requiredXp: number;
  requiredLevel: number;
  isActive: boolean;
  sortOrder: number;
};

type GamificationConfig = {
  schoolId: string;
  xpRules: XpRules;
  levelConfig: LevelConfig;
  medals: MedalDefinition[];
  avatarOptions: AvatarOptionDefinition[];
};

type DiceBearStyleSummary = {
  styleId: string;
  displayName: string;
  creator: string;
  apiUrl: string;
  categoriesCount: number;
  optionsCount: number;
  isActive: boolean;
  sortOrder: number;
};

const CONDITION_TYPES = [
  { value: 'tests_completed', label: 'Tests completados' },
  { value: 'workshops_completed', label: 'Talleres completados' },
  { value: 'perfect_scores', label: 'Puntajes perfectos' },
  { value: 'streak_days', label: 'Días de racha' },
  { value: 'ranking_position', label: 'Posición en ranking' },
  { value: 'total_xp', label: 'XP total' },
];

export default function ExperienceManagerPage() {
  const router = useRouter();
  const [config, setConfig] = useState<GamificationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'xp' | 'levels' | 'medals' | 'styles'>('xp');

  // DiceBear styles
  const [dicebearStyles, setDicebearStyles] = useState<DiceBearStyleSummary[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(false);

  // Medal editing
  const [editingMedal, setEditingMedal] = useState<MedalDefinition | null>(null);
  const [showMedalForm, setShowMedalForm] = useState(false);
  const [draggedMedalId, setDraggedMedalId] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (activeTab === 'styles') {
      fetchDiceBearStyles();
    }
  }, [activeTab]);

  async function fetchDiceBearStyles() {
    setLoadingStyles(true);
    try {
      const res = await fetch('/api/gamification/dicebear/styles');
      if (res.ok) {
        const data = await res.json();
        setDicebearStyles(data);
      }
    } catch (e) {
      console.error('Error fetching DiceBear styles:', e);
    } finally {
      setLoadingStyles(false);
    }
  }

  async function updateStyleUnlockRequirements(styleId: string, requiredXp: number, requiredLevel: number) {
    setSaving(true);
    setError(null);
    try {
      // Find or create avatar option for this style
      const existingOption = config?.avatarOptions?.find(
        opt => opt.category === 'style' && opt.value === styleId
      );
      
      const option: AvatarOptionDefinition = existingOption || {
        id: `style_${styleId}`,
        category: 'style',
        value: styleId,
        displayName: dicebearStyles.find(s => s.styleId === styleId)?.displayName || styleId,
        requiredXp: 0,
        requiredLevel: 0,
        isActive: true,
        sortOrder: config?.avatarOptions?.length || 0,
      };
      
      option.requiredXp = requiredXp;
      option.requiredLevel = requiredLevel;
      
      const res = await fetch('/api/gamification/avatar-options', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(option),
      });
      
      if (!res.ok) throw new Error('Error al guardar requisitos');
      await fetchConfig();
      setSuccess(`Requisitos de ${styleId} actualizados`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStyleActive(styleId: string, isActive: boolean) {
    setSaving(true);
    try {
      const res = await fetch(`/api/gamification/dicebear/styles/${styleId}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error('Error al actualizar estilo');
      await fetchDiceBearStyles();
      setSuccess(`Estilo ${isActive ? 'activado' : 'desactivado'}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }


  async function fetchConfig() {
    try {
      const res = await fetch('/api/gamification/config');
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.replace('/login');
          return;
        }
        throw new Error('Error al cargar configuración');
      }
      const data = await res.json();
      setConfig(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveXpRules() {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/gamification/config/xp-rules', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(config.xpRules),
      });
      if (!res.ok) throw new Error('Error al guardar reglas de XP');
      setSuccess('Reglas de XP guardadas correctamente');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveLevelConfig() {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/gamification/config/level', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(config.levelConfig),
      });
      if (!res.ok) throw new Error('Error al guardar configuración de niveles');
      setSuccess('Configuración de niveles guardada correctamente');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveMedal(medal: MedalDefinition) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/gamification/medals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(medal),
      });
      if (!res.ok) throw new Error('Error al guardar medalla');
      await fetchConfig();
      setShowMedalForm(false);
      setEditingMedal(null);
      setSuccess('Medalla guardada correctamente');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteMedal(medalId: string) {
    if (!confirm('¿Eliminar esta medalla?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/gamification/medals/${medalId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar medalla');
      await fetchConfig();
      setSuccess('Medalla eliminada');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function exportMedals() {
    if (!config) return;
    const data = JSON.stringify(config.medals, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medallas-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccess('Medallas exportadas correctamente');
  }

  function importMedals(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !config) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const medals = JSON.parse(e.target?.result as string) as MedalDefinition[];
        if (!Array.isArray(medals)) throw new Error('Formato inválido');
        
        // Validate and import each medal
        for (const medal of medals) {
          if (!medal.name || !medal.description) continue;
          medal.id = `medal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          medal.sortOrder = config.medals.length;
          await saveMedal(medal);
        }
        
        await fetchConfig();
        setSuccess(`${medals.length} medallas importadas`);
      } catch (err) {
        setError('Error al importar: formato inválido');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  }

  async function reorderMedals(draggedId: string, targetId: string) {
    if (!config || draggedId === targetId) return;
    
    const medals = [...config.medals];
    const draggedIndex = medals.findIndex(m => m.id === draggedId);
    const targetIndex = medals.findIndex(m => m.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Remove dragged item and insert at target position
    const [draggedMedal] = medals.splice(draggedIndex, 1);
    medals.splice(targetIndex, 0, draggedMedal);
    
    // Update sort orders
    medals.forEach((m, i) => { m.sortOrder = i; });
    
    // Optimistic update
    setConfig({ ...config, medals });
    
    // Save to backend
    try {
      const res = await fetch('/api/gamification/medals/reorder', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ medalIds: medals.map(m => m.id) }),
      });
      if (!res.ok) throw new Error('Error al reordenar');
    } catch (e: any) {
      // Revert on error
      await fetchConfig();
      setError(e.message);
    }
  }

  function updateXpRule(key: keyof XpRules, value: number) {
    if (!config) return;
    setConfig({
      ...config,
      xpRules: { ...config.xpRules, [key]: value },
    });
  }

  function updateLevelConfig(key: keyof LevelConfig, value: number) {
    if (!config) return;
    setConfig({
      ...config,
      levelConfig: { ...config.levelConfig, [key]: value },
    });
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="ce-card p-6 text-zinc-400">Cargando configuración...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-6">
        <div className="ce-card p-6 text-red-400">Error al cargar configuración</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="ce-chip">Experience Manager</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            <span className="ce-title-gradient">Configuración de Gamificación</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-300">
            Controla cómo se gana XP, los niveles y las medallas.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b border-zinc-700 pb-2">
        <button
          onClick={() => setActiveTab('xp')}
          className={`flex items-center gap-1 px-4 py-2 rounded-t-lg text-sm font-medium ${
            activeTab === 'xp' ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Star className="h-4 w-4" /> Reglas de XP
        </button>
        <button
          onClick={() => setActiveTab('levels')}
          className={`flex items-center gap-1 px-4 py-2 rounded-t-lg text-sm font-medium ${
            activeTab === 'levels' ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BarChart3 className="h-4 w-4" /> Niveles
        </button>
        <button
          onClick={() => setActiveTab('medals')}
          className={`flex items-center gap-1 px-4 py-2 rounded-t-lg text-sm font-medium ${
            activeTab === 'medals' ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Medal className="h-4 w-4" /> Medallas ({config.medals.length})
        </button>
        <button
          onClick={() => setActiveTab('styles')}
          className={`flex items-center gap-1 px-4 py-2 rounded-t-lg text-sm font-medium ${
            activeTab === 'styles' ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Palette className="h-4 w-4" /> Estilos DiceBear ({dicebearStyles.length})
        </button>
      </div>

      {/* XP Rules Tab */}
      {activeTab === 'xp' && (
        <div className="mt-6 ce-card p-6">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Reglas de Experiencia (XP)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-fuchsia-300">Tests</h3>
              
              <div>
                <label className="block text-sm text-zinc-400">XP base por completar test</label>
                <input
                  type="number"
                  value={config.xpRules.testBaseXp}
                  onChange={(e) => updateXpRule('testBaseXp', parseInt(e.target.value) || 0)}
                  className="ce-field mt-1"
                />
                <p className="text-xs text-zinc-500 mt-1">XP que se da solo por completar el test</p>
              </div>

              <div>
                <label className="block text-sm text-zinc-400">Multiplicador de puntos</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.xpRules.testPointMultiplier}
                  onChange={(e) => updateXpRule('testPointMultiplier', parseFloat(e.target.value) || 1)}
                  className="ce-field mt-1"
                />
                <p className="text-xs text-zinc-500 mt-1">XP = puntaje × multiplicador (ej: 80 pts × 1 = 80 XP)</p>
              </div>

              <div>
                <label className="block text-sm text-zinc-400">Bonus por puntaje perfecto</label>
                <input
                  type="number"
                  value={config.xpRules.testPerfectBonus}
                  onChange={(e) => updateXpRule('testPerfectBonus', parseInt(e.target.value) || 0)}
                  className="ce-field mt-1"
                />
                <p className="text-xs text-zinc-500 mt-1">XP extra si saca 100%</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-fuchsia-300">Talleres y Rachas</h3>
              
              <div>
                <label className="block text-sm text-zinc-400">XP por completar taller</label>
                <input
                  type="number"
                  value={config.xpRules.workshopCompletionXp}
                  onChange={(e) => updateXpRule('workshopCompletionXp', parseInt(e.target.value) || 0)}
                  className="ce-field mt-1"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400">XP diario por racha</label>
                <input
                  type="number"
                  value={config.xpRules.dailyStreakXp}
                  onChange={(e) => updateXpRule('dailyStreakXp', parseInt(e.target.value) || 0)}
                  className="ce-field mt-1"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400">Bonus racha semanal (7 días)</label>
                <input
                  type="number"
                  value={config.xpRules.weeklyStreakBonus}
                  onChange={(e) => updateXpRule('weeklyStreakBonus', parseInt(e.target.value) || 0)}
                  className="ce-field mt-1"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400">Bonus racha mensual (30 días)</label>
                <input
                  type="number"
                  value={config.xpRules.monthlyStreakBonus}
                  onChange={(e) => updateXpRule('monthlyStreakBonus', parseInt(e.target.value) || 0)}
                  className="ce-field mt-1"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-zinc-800/50">
            <h4 className="text-sm font-medium text-zinc-300">Vista previa de fórmula</h4>
            <p className="text-xs text-zinc-400 mt-2">
              Test: <span className="text-fuchsia-300">{config.xpRules.testBaseXp} + (puntaje × {config.xpRules.testPointMultiplier})</span>
              {config.xpRules.testPerfectBonus > 0 && (
                <span className="text-amber-300"> + {config.xpRules.testPerfectBonus} si es 100%</span>
              )}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Ejemplo: Un test de 80 puntos = <span className="text-emerald-300">{config.xpRules.testBaseXp + Math.round(80 * config.xpRules.testPointMultiplier)} XP</span>
            </p>
          </div>

          <button
            onClick={saveXpRules}
            disabled={saving}
            className="ce-btn ce-btn-primary mt-6"
          >
            {saving ? 'Guardando...' : 'Guardar reglas de XP'}
          </button>
        </div>
      )}

      {/* Levels Tab */}
      {activeTab === 'levels' && (
        <div className="mt-6 ce-card p-6">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Configuración de Niveles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-zinc-400">XP base por nivel</label>
              <input
                type="number"
                value={config.levelConfig.baseXpPerLevel}
                onChange={(e) => updateLevelConfig('baseXpPerLevel', parseInt(e.target.value) || 100)}
                className="ce-field mt-1"
              />
              <p className="text-xs text-zinc-500 mt-1">XP para nivel 1</p>
            </div>

            <div>
              <label className="block text-sm text-zinc-400">Multiplicador por nivel</label>
              <input
                type="number"
                step="0.1"
                value={config.levelConfig.levelMultiplier}
                onChange={(e) => updateLevelConfig('levelMultiplier', parseFloat(e.target.value) || 1.2)}
                className="ce-field mt-1"
              />
              <p className="text-xs text-zinc-500 mt-1">Cada nivel necesita más XP (exponencial)</p>
            </div>

            <div>
              <label className="block text-sm text-zinc-400">Nivel máximo</label>
              <input
                type="number"
                value={config.levelConfig.maxLevel}
                onChange={(e) => updateLevelConfig('maxLevel', parseInt(e.target.value) || 50)}
                className="ce-field mt-1"
              />
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-zinc-800/50">
            <h4 className="text-sm font-medium text-zinc-300">Tabla de niveles (primeros 10)</h4>
            <div className="mt-3 grid grid-cols-5 gap-2 text-xs">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => {
                const xpNeeded = Math.round(
                  config.levelConfig.baseXpPerLevel * Math.pow(config.levelConfig.levelMultiplier, level - 1)
                );
                return (
                  <div key={level} className="bg-zinc-900 rounded p-2 text-center">
                    <div className="text-fuchsia-300 font-bold">Nv. {level}</div>
                    <div className="text-zinc-400">{xpNeeded} XP</div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={saveLevelConfig}
            disabled={saving}
            className="ce-btn ce-btn-primary mt-6"
          >
            {saving ? 'Guardando...' : 'Guardar configuración de niveles'}
          </button>
        </div>
      )}

      {/* Medals Tab */}
      {activeTab === 'medals' && (
        <div className="mt-6">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-zinc-100">Medallas</h2>
            <div className="flex gap-2">
              <button
                onClick={exportMedals}
                disabled={!config.medals.length}
                className="ce-btn ce-btn-ghost flex items-center gap-1.5 text-sm"
              >
                <Download className="h-4 w-4" /> Exportar
              </button>
              <label className="ce-btn ce-btn-ghost flex items-center gap-1.5 text-sm cursor-pointer">
                <Upload className="h-4 w-4" /> Importar
                <input
                  type="file"
                  accept=".json"
                  onChange={importMedals}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => {
                  setEditingMedal({
                    id: `medal_${Date.now()}`,
                    name: '',
                    description: '',
                    icon: 'Trophy',
                    iconType: 'lucide',
                    iconColor: '#fbbf24',
                    bgColor: '#fbbf2420',
                    borderColor: '#fbbf24',
                    shape: 'circle',
                    glow: false,
                    xpReward: 50,
                    conditionType: 'tests_completed',
                    conditionValue: 1,
                    isActive: true,
                    sortOrder: config.medals.length,
                  });
                  setShowMedalForm(true);
                }}
                className="ce-btn ce-btn-primary flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Nueva medalla
              </button>
            </div>
          </div>

          {showMedalForm && editingMedal && (
            <div className="ce-card p-6 mb-4 border border-fuchsia-500/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <MedalPreview
                    design={{
                      shape: editingMedal.shape || 'circle',
                      icon: editingMedal.icon,
                      iconColor: editingMedal.iconColor || '#fbbf24',
                      bgColor: editingMedal.bgColor || '#fbbf2420',
                      borderColor: editingMedal.borderColor || '#fbbf24',
                      borderWidth: 2,
                      size: 'lg',
                      glow: editingMedal.glow || false,
                    }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-100">
                      {editingMedal.name || 'Nueva medalla'}
                    </h3>
                    <p className="text-sm text-zinc-400">{editingMedal.description || 'Sin descripción'}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowMedalForm(false); setEditingMedal(null); }}
                  className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left column: Basic info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-zinc-300 border-b border-white/10 pb-2">Información</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs text-zinc-400 mb-1">Nombre *</label>
                      <input
                        type="text"
                        value={editingMedal.name}
                        onChange={(e) => setEditingMedal({ ...editingMedal, name: e.target.value })}
                        className="ce-field w-full"
                        placeholder="Ej: Primer Paso"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-zinc-400 mb-1">Descripción *</label>
                      <input
                        type="text"
                        value={editingMedal.description}
                        onChange={(e) => setEditingMedal({ ...editingMedal, description: e.target.value })}
                        className="ce-field w-full"
                        placeholder="Ej: Completa tu primer test"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">XP Recompensa</label>
                      <input
                        type="number"
                        value={editingMedal.xpReward}
                        onChange={(e) => setEditingMedal({ ...editingMedal, xpReward: parseInt(e.target.value) || 0 })}
                        className="ce-field w-full"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Estado</label>
                      <select
                        value={editingMedal.isActive ? 'true' : 'false'}
                        onChange={(e) => setEditingMedal({ ...editingMedal, isActive: e.target.value === 'true' })}
                        className="ce-field w-full"
                      >
                        <option value="true">Activa</option>
                        <option value="false">Inactiva</option>
                      </select>
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-zinc-300 border-b border-white/10 pb-2 pt-2">Condición</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Tipo</label>
                      <select
                        value={editingMedal.conditionType}
                        onChange={(e) => setEditingMedal({ ...editingMedal, conditionType: e.target.value })}
                        className="ce-field w-full"
                      >
                        {CONDITION_TYPES.map((ct) => (
                          <option key={ct.value} value={ct.value}>{ct.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Valor</label>
                      <input
                        type="number"
                        value={editingMedal.conditionValue}
                        onChange={(e) => setEditingMedal({ ...editingMedal, conditionValue: parseInt(e.target.value) || 1 })}
                        className="ce-field w-full"
                        min={1}
                      />
                    </div>
                  </div>
                </div>

                {/* Right column: Design */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-zinc-300 border-b border-white/10 pb-2">Diseño Visual</h4>
                  <MedalDesigner
                    initialDesign={{
                      shape: editingMedal.shape || 'circle',
                      icon: editingMedal.icon,
                      iconColor: editingMedal.iconColor || '#fbbf24',
                      bgColor: editingMedal.bgColor || '#fbbf2420',
                      borderColor: editingMedal.borderColor || '#fbbf24',
                      borderWidth: 2,
                      size: 'lg',
                      glow: editingMedal.glow || false,
                    }}
                    onChange={(design) => {
                      setEditingMedal({
                        ...editingMedal,
                        icon: design.icon,
                        iconType: 'lucide',
                        iconColor: design.iconColor,
                        bgColor: design.bgColor,
                        borderColor: design.borderColor,
                        shape: design.shape,
                        glow: design.glow,
                      });
                    }}
                    showPreviewSizes={false}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3 border-t border-white/10 pt-4">
                <button
                  onClick={() => saveMedal(editingMedal)}
                  disabled={saving || !editingMedal.name || !editingMedal.description}
                  className="ce-btn ce-btn-primary flex-1"
                >
                  {saving ? 'Guardando...' : 'Guardar medalla'}
                </button>
                <button
                  onClick={() => { setShowMedalForm(false); setEditingMedal(null); }}
                  className="ce-btn ce-btn-ghost"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.medals
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((medal) => (
              <div
                key={medal.id}
                draggable
                onDragStart={() => setDraggedMedalId(medal.id)}
                onDragEnd={() => setDraggedMedalId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedMedalId && draggedMedalId !== medal.id) {
                    reorderMedals(draggedMedalId, medal.id);
                  }
                }}
                className={`ce-card p-4 transition-all cursor-grab active:cursor-grabbing ${
                  !medal.isActive ? 'opacity-50' : ''
                } ${draggedMedalId === medal.id ? 'opacity-50 scale-95' : ''} ${
                  draggedMedalId && draggedMedalId !== medal.id ? 'ring-2 ring-fuchsia-500/30' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-zinc-600 hover:text-zinc-400" />
                    <MedalBadge
                      medal={{
                        type: medal.id,
                        name: medal.name,
                        description: medal.description,
                        icon: medal.icon,
                        iconType: medal.iconType || 'emoji',
                        iconColor: medal.iconColor,
                        bgColor: medal.bgColor,
                        borderColor: medal.borderColor,
                        shape: medal.shape,
                        glow: medal.glow,
                        xp: medal.xpReward,
                        earned: true,
                      }}
                      size="md"
                      showTooltip={false}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-zinc-100">{medal.name}</div>
                    <div className="text-xs text-zinc-400 truncate">{medal.description}</div>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span className="text-fuchsia-300">+{medal.xpReward} XP</span>
                      <span className="text-zinc-500">
                        {CONDITION_TYPES.find((ct) => ct.value === medal.conditionType)?.label}: {medal.conditionValue}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-white/5 pt-3">
                  <button
                    onClick={() => { setEditingMedal(medal); setShowMedalForm(true); }}
                    className="flex items-center gap-1 text-xs text-fuchsia-300 hover:text-fuchsia-200"
                  >
                    <Edit2 className="h-3 w-3" /> Editar
                  </button>
                  <button
                    onClick={() => deleteMedal(medal.id)}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-3 w-3" /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DiceBear Styles Tab */}
      {activeTab === 'styles' && (
        <div className="mt-6 space-y-6">
          {/* Header con estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="ce-card p-4 bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 border-fuchsia-500/20">
              <div className="text-2xl font-bold text-fuchsia-300">{dicebearStyles.length}</div>
              <div className="text-xs text-zinc-400">Estilos Totales</div>
            </div>
            <div className="ce-card p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <div className="text-2xl font-bold text-green-300">{dicebearStyles.filter(s => s.isActive).length}</div>
              <div className="text-xs text-zinc-400">Activos</div>
            </div>
            <div className="ce-card p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
              <div className="text-2xl font-bold text-cyan-300">
                {dicebearStyles.reduce((sum, s) => sum + s.categoriesCount, 0)}
              </div>
              <div className="text-xs text-zinc-400">Categorías</div>
            </div>
            <div className="ce-card p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
              <div className="text-2xl font-bold text-amber-300">
                {dicebearStyles.reduce((sum, s) => sum + s.optionsCount, 0).toLocaleString()}
              </div>
              <div className="text-xs text-zinc-400">Opciones</div>
            </div>
          </div>

          {/* Info y acciones */}
          <div className="ce-card p-4 bg-zinc-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-300">
                <strong>Haz clic en "Configurar"</strong> para personalizar los requisitos de desbloqueo de cada opción dentro de un estilo.
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Los campos de XP y Nivel aquí configuran el requisito para desbloquear todo el estilo.
              </p>
            </div>
            <button
              onClick={fetchDiceBearStyles}
              disabled={loadingStyles}
              className="ce-btn ce-btn-ghost text-sm whitespace-nowrap"
            >
              {loadingStyles ? '⏳ Cargando...' : '🔄 Actualizar lista'}
            </button>
          </div>

          {loadingStyles ? (
            <div className="ce-card p-8 text-center text-zinc-400">
              <div className="animate-spin w-10 h-10 border-3 border-fuchsia-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p>Cargando estilos de DiceBear...</p>
            </div>
          ) : dicebearStyles.length === 0 ? (
            <div className="ce-card p-8 text-center">
              <div className="text-4xl mb-4">🎨</div>
              <p className="text-zinc-300 font-medium">No hay estilos sincronizados</p>
              <p className="text-sm text-zinc-500 mt-2">
                Ejecuta el comando de sincronización para importar los estilos de DiceBear:
              </p>
              <code className="mt-3 inline-block bg-zinc-800 px-4 py-2 rounded-lg text-fuchsia-300 text-sm">
                npm run sync-dicebear -w api
              </code>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {dicebearStyles.map((style) => {
                const styleOption = config?.avatarOptions?.find(
                  opt => opt.category === 'style' && opt.value === style.styleId
                );
                const requiredXp = styleOption?.requiredXp ?? 0;
                const requiredLevel = styleOption?.requiredLevel ?? 0;
                const isFree = requiredXp === 0 && requiredLevel === 0;
                
                return (
                  <div
                    key={style.styleId}
                    className={`ce-card p-4 transition-all hover:border-fuchsia-500/30 hover:shadow-lg hover:shadow-fuchsia-500/5 ${
                      !style.isActive ? 'opacity-40 grayscale' : ''
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <img
                          src={`${style.apiUrl}?seed=preview&size=72`}
                          alt={style.displayName}
                          className="w-18 h-18 rounded-xl bg-zinc-800 shadow-lg"
                          loading="lazy"
                        />
                        {!style.isActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                            <span className="text-xs text-zinc-300">Inactivo</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-zinc-100 truncate">{style.displayName}</h3>
                          <label className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="checkbox"
                              checked={style.isActive}
                              onChange={(e) => toggleStyleActive(style.styleId, e.target.checked)}
                              className="rounded border-zinc-600 text-fuchsia-500 focus:ring-fuchsia-500"
                            />
                            <span className="text-xs text-zinc-500">Activo</span>
                          </label>
                        </div>
                        <p className="text-xs text-zinc-500">por {style.creator}</p>
                        <div className="flex gap-3 mt-2">
                          <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                            {style.categoriesCount} categorías
                          </span>
                          <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                            {style.optionsCount} opciones
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Requisitos */}
                    <div className="mt-4 p-3 rounded-lg bg-zinc-800/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-zinc-400">Requisitos de desbloqueo</span>
                        {isFree ? (
                          <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">✓ Gratis</span>
                        ) : (
                          <span className="text-xs text-fuchsia-300 bg-fuchsia-500/10 px-2 py-0.5 rounded-full">🔒 Bloqueado</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">XP</label>
                          <input
                            type="number"
                            defaultValue={requiredXp}
                            onBlur={(e) => {
                              const newXp = parseInt(e.target.value) || 0;
                              if (newXp !== requiredXp) {
                                updateStyleUnlockRequirements(style.styleId, newXp, requiredLevel);
                              }
                            }}
                            className="ce-field text-sm"
                            min={0}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Nivel</label>
                          <input
                            type="number"
                            defaultValue={requiredLevel}
                            onBlur={(e) => {
                              const newLevel = parseInt(e.target.value) || 0;
                              if (newLevel !== requiredLevel) {
                                updateStyleUnlockRequirements(style.styleId, requiredXp, newLevel);
                              }
                            }}
                            className="ce-field text-sm"
                            min={0}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Acción */}
                    <button
                      onClick={() => router.push(`/admin/experiencia/estilos/${style.styleId}`)}
                      className="mt-4 w-full ce-btn ce-btn-ghost text-sm justify-center group"
                    >
                      <span>Configurar opciones</span>
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
