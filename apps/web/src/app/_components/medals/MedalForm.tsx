'use client';

import { useState } from 'react';
import MedalDesigner, { MedalDesign, DEFAULT_MEDAL_DESIGN, MedalPreview } from './MedalDesigner';
import { Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { MedalShape } from '../progress/MedalBadge';

// Condition types for earning medals
export type ConditionType = 
  | 'tests_completed'
  | 'workshops_completed'
  | 'perfect_scores'
  | 'streak_days'
  | 'ranking_position'
  | 'total_xp'
  | 'level_reached';

export type ConditionOperator = 'gte' | 'lte' | 'eq';

// Full medal definition
export type MedalDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconType: 'lucide' | 'emoji' | 'svg';
  iconColor: string;
  bgColor: string;
  borderColor: string;
  shape: MedalShape;
  glow: boolean;
  xpReward: number;
  conditionType: ConditionType;
  conditionValue: number;
  conditionOperator: ConditionOperator;
  isActive: boolean;
  sortOrder: number;
};

// Default new medal
const DEFAULT_MEDAL: Omit<MedalDefinition, 'id' | 'sortOrder'> = {
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
  conditionOperator: 'gte',
  isActive: true,
};

const CONDITION_TYPES: { value: ConditionType; label: string; description: string }[] = [
  { value: 'tests_completed', label: 'Tests Completados', description: 'Número de tests completados' },
  { value: 'workshops_completed', label: 'Talleres Completados', description: 'Número de talleres completados' },
  { value: 'perfect_scores', label: 'Puntuaciones Perfectas', description: 'Tests con 100% de acierto' },
  { value: 'streak_days', label: 'Días de Racha', description: 'Días consecutivos activo' },
  { value: 'ranking_position', label: 'Posición en Ranking', description: 'Posición en el ranking general' },
  { value: 'total_xp', label: 'XP Total', description: 'Experiencia total acumulada' },
  { value: 'level_reached', label: 'Nivel Alcanzado', description: 'Nivel mínimo requerido' },
];

const CONDITION_OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'gte', label: '≥ Mayor o igual' },
  { value: 'lte', label: '≤ Menor o igual' },
  { value: 'eq', label: '= Igual a' },
];

type Props = {
  medal?: Partial<MedalDefinition>;
  onSave: (medal: Omit<MedalDefinition, 'id' | 'sortOrder'>) => Promise<void>;
  onCancel: () => void;
  isNew?: boolean;
};

export default function MedalForm({ medal, onSave, onCancel, isNew = false }: Props) {
  const [formData, setFormData] = useState<Omit<MedalDefinition, 'id' | 'sortOrder'>>({
    ...DEFAULT_MEDAL,
    ...medal,
  });
  
  const [designExpanded, setDesignExpanded] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form data
  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Handle design changes from MedalDesigner
  const handleDesignChange = (design: MedalDesign) => {
    setFormData(prev => ({
      ...prev,
      icon: design.icon,
      iconColor: design.iconColor,
      bgColor: design.bgColor,
      borderColor: design.borderColor,
      shape: design.shape,
      glow: design.glow,
    }));
  };

  // Validate and save
  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (!formData.description.trim()) {
      setError('La descripción es requerida');
      return;
    }
    if (formData.xpReward < 0) {
      setError('La recompensa XP debe ser positiva');
      return;
    }
    if (formData.conditionValue < 0) {
      setError('El valor de condición debe ser positivo');
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Current design for preview
  const currentDesign: MedalDesign = {
    shape: formData.shape,
    icon: formData.icon,
    iconColor: formData.iconColor,
    bgColor: formData.bgColor,
    borderColor: formData.borderColor,
    borderWidth: 2,
    size: 'lg',
    glow: formData.glow,
  };

  return (
    <div className="space-y-6">
      {/* Header with preview */}
      <div className="flex items-start gap-6">
        <MedalPreview design={{ ...currentDesign, size: 'xl' }} />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-zinc-100">
            {isNew ? 'Nueva Medalla' : 'Editar Medalla'}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Configura el diseño, condiciones y recompensas de la medalla
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="ce-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">Información Básica</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Nombre *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Ej: Primer Paso"
              className="w-full bg-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 border border-zinc-700 focus:border-fuchsia-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Recompensa XP *</label>
            <input
              type="number"
              value={formData.xpReward}
              onChange={(e) => updateField('xpReward', parseInt(e.target.value) || 0)}
              min={0}
              className="w-full bg-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 border border-zinc-700 focus:border-fuchsia-500/50 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Descripción *</label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Ej: Completa tu primer test"
            rows={2}
            className="w-full bg-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 border border-zinc-700 focus:border-fuchsia-500/50 focus:outline-none resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-zinc-400">Estado:</label>
          <button
            onClick={() => updateField('isActive', !formData.isActive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              formData.isActive
                ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                : 'bg-zinc-800 text-zinc-400 border border-transparent'
            }`}
          >
            {formData.isActive ? 'Activa' : 'Inactiva'}
          </button>
        </div>
      </div>

      {/* Condition Configuration */}
      <div className="ce-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">Condición de Desbloqueo</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Tipo de Condición</label>
            <select
              value={formData.conditionType}
              onChange={(e) => updateField('conditionType', e.target.value as ConditionType)}
              className="w-full bg-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 border border-zinc-700 focus:border-fuchsia-500/50 focus:outline-none"
            >
              {CONDITION_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
            <p className="text-xs text-zinc-500 mt-1">
              {CONDITION_TYPES.find(ct => ct.value === formData.conditionType)?.description}
            </p>
          </div>
          
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Operador</label>
            <select
              value={formData.conditionOperator}
              onChange={(e) => updateField('conditionOperator', e.target.value as ConditionOperator)}
              className="w-full bg-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 border border-zinc-700 focus:border-fuchsia-500/50 focus:outline-none"
            >
              {CONDITION_OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Valor</label>
            <input
              type="number"
              value={formData.conditionValue}
              onChange={(e) => updateField('conditionValue', parseInt(e.target.value) || 0)}
              min={0}
              className="w-full bg-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 border border-zinc-700 focus:border-fuchsia-500/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Condition Preview */}
        <div className="rounded-lg bg-zinc-800/50 p-3 text-sm text-zinc-300">
          <span className="text-zinc-500">La medalla se desbloqueará cuando:</span>
          <br />
          <strong className="text-fuchsia-300">{formData.name || 'Esta medalla'}</strong>
          {' → '}
          {CONDITION_TYPES.find(ct => ct.value === formData.conditionType)?.label}
          {' '}
          {CONDITION_OPERATORS.find(op => op.value === formData.conditionOperator)?.label}
          {' '}
          <strong className="text-cyan-300">{formData.conditionValue}</strong>
        </div>
      </div>

      {/* Design Section (Collapsible) */}
      <div className="ce-card overflow-hidden">
        <button
          onClick={() => setDesignExpanded(!designExpanded)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
        >
          <h3 className="text-sm font-semibold text-zinc-200">Diseño Visual</h3>
          {designExpanded ? (
            <ChevronUp className="h-5 w-5 text-zinc-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-zinc-400" />
          )}
        </button>
        
        {designExpanded && (
          <div className="px-5 pb-5 border-t border-white/5 pt-4">
            <MedalDesigner
              initialDesign={currentDesign}
              onChange={handleDesignChange}
              showPreviewSizes={false}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="ce-btn flex items-center gap-2 text-zinc-400 hover:text-zinc-200"
        >
          <X className="h-4 w-4" />
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ce-btn ce-btn-primary flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Guardando...' : (isNew ? 'Crear Medalla' : 'Guardar Cambios')}
        </button>
      </div>
    </div>
  );
}
