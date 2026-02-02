'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

type MedalDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  conditionType: string;
  conditionValue: number;
  conditionOperator?: string;
  isActive: boolean;
  sortOrder: number;
};

type GamificationConfig = {
  schoolId: string;
  xpRules: XpRules;
  levelConfig: LevelConfig;
  medals: MedalDefinition[];
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
  const [activeTab, setActiveTab] = useState<'xp' | 'levels' | 'medals'>('xp');

  // Medal editing
  const [editingMedal, setEditingMedal] = useState<MedalDefinition | null>(null);
  const [showMedalForm, setShowMedalForm] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

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
          className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
            activeTab === 'xp' ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          ⭐ Reglas de XP
        </button>
        <button
          onClick={() => setActiveTab('levels')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
            activeTab === 'levels' ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          📊 Niveles
        </button>
        <button
          onClick={() => setActiveTab('medals')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
            activeTab === 'medals' ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          🏅 Medallas ({config.medals.length})
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-zinc-100">Medallas</h2>
            <button
              onClick={() => {
                setEditingMedal({
                  id: `medal_${Date.now()}`,
                  name: '',
                  description: '',
                  icon: '🏅',
                  xpReward: 50,
                  conditionType: 'tests_completed',
                  conditionValue: 1,
                  isActive: true,
                  sortOrder: config.medals.length,
                });
                setShowMedalForm(true);
              }}
              className="ce-btn ce-btn-primary"
            >
              + Nueva medalla
            </button>
          </div>

          {showMedalForm && editingMedal && (
            <div className="ce-card p-6 mb-4 border border-fuchsia-500/30">
              <h3 className="text-md font-semibold text-fuchsia-300 mb-4">
                {editingMedal.name ? `Editar: ${editingMedal.name}` : 'Nueva medalla'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400">Icono (emoji)</label>
                  <input
                    type="text"
                    value={editingMedal.icon}
                    onChange={(e) => setEditingMedal({ ...editingMedal, icon: e.target.value })}
                    className="ce-field mt-1"
                    maxLength={4}
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400">Nombre</label>
                  <input
                    type="text"
                    value={editingMedal.name}
                    onChange={(e) => setEditingMedal({ ...editingMedal, name: e.target.value })}
                    className="ce-field mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-zinc-400">Descripción</label>
                  <input
                    type="text"
                    value={editingMedal.description}
                    onChange={(e) => setEditingMedal({ ...editingMedal, description: e.target.value })}
                    className="ce-field mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400">XP de recompensa</label>
                  <input
                    type="number"
                    value={editingMedal.xpReward}
                    onChange={(e) => setEditingMedal({ ...editingMedal, xpReward: parseInt(e.target.value) || 0 })}
                    className="ce-field mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400">Condición</label>
                  <select
                    value={editingMedal.conditionType}
                    onChange={(e) => setEditingMedal({ ...editingMedal, conditionType: e.target.value })}
                    className="ce-field mt-1"
                  >
                    {CONDITION_TYPES.map((ct) => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400">Valor requerido</label>
                  <input
                    type="number"
                    value={editingMedal.conditionValue}
                    onChange={(e) => setEditingMedal({ ...editingMedal, conditionValue: parseInt(e.target.value) || 1 })}
                    className="ce-field mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400">Activa</label>
                  <select
                    value={editingMedal.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditingMedal({ ...editingMedal, isActive: e.target.value === 'true' })}
                    className="ce-field mt-1"
                  >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => saveMedal(editingMedal)}
                  disabled={saving || !editingMedal.name}
                  className="ce-btn ce-btn-primary"
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
            {config.medals.map((medal) => (
              <div
                key={medal.id}
                className={`ce-card p-4 ${!medal.isActive ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{medal.icon}</span>
                    <div>
                      <div className="font-semibold text-zinc-100">{medal.name}</div>
                      <div className="text-xs text-zinc-400">{medal.description}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-fuchsia-300">+{medal.xpReward} XP</span>
                  <span className="text-zinc-500">
                    {CONDITION_TYPES.find((ct) => ct.value === medal.conditionType)?.label}: {medal.conditionValue}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => { setEditingMedal(medal); setShowMedalForm(true); }}
                    className="text-xs text-fuchsia-300 hover:text-fuchsia-200"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteMedal(medal.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
