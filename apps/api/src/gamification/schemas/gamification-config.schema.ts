import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GamificationConfigDocument = GamificationConfig & Document;

// XP Rules for different actions
@Schema({ _id: false })
export class XpRules {
  // Test completion XP
  @Prop({ required: true, default: 0 })
  testBaseXp!: number; // Base XP just for completing a test

  @Prop({ required: true, default: 1 })
  testPointMultiplier!: number; // XP = score * multiplier (e.g., score 80 * 1 = 80 XP)

  @Prop({ required: true, default: 20 })
  testPerfectBonus!: number; // Bonus XP for 100% score

  // Workshop completion XP
  @Prop({ required: true, default: 50 })
  workshopCompletionXp!: number; // XP for completing all tests in a workshop

  // Streak bonuses
  @Prop({ required: true, default: 5 })
  dailyStreakXp!: number; // XP per day of streak

  @Prop({ required: true, default: 50 })
  weeklyStreakBonus!: number; // Bonus at 7 days

  @Prop({ required: true, default: 200 })
  monthlyStreakBonus!: number; // Bonus at 30 days
}

export const XpRulesSchema = SchemaFactory.createForClass(XpRules);

// Level configuration
@Schema({ _id: false })
export class LevelConfig {
  @Prop({ required: true, default: 100 })
  baseXpPerLevel!: number; // XP needed for level 1

  @Prop({ required: true, default: 1.2 })
  levelMultiplier!: number; // Each level needs this much more (exponential)

  @Prop({ required: true, default: 50 })
  maxLevel!: number; // Maximum level achievable
}

export const LevelConfigSchema = SchemaFactory.createForClass(LevelConfig);

// Medal definition (dynamic, not hardcoded)
@Schema({ _id: false })
export class MedalDefinition {
  @Prop({ required: true })
  id!: string; // unique identifier

  @Prop({ required: true })
  name!: string; // Display name

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  icon!: string; // Emoji or icon identifier

  @Prop({ required: true, default: 0 })
  xpReward!: number; // XP granted when earned

  @Prop({ required: true })
  conditionType!: string; // 'workshops_completed' | 'tests_completed' | 'perfect_scores' | 'streak_days' | 'ranking_position' | 'total_xp'

  @Prop({ required: true })
  conditionValue!: number; // e.g., 5 for "complete 5 workshops"

  @Prop({ required: false })
  conditionOperator?: string; // 'gte' | 'lte' | 'eq' (default: gte)

  @Prop({ required: true, default: true })
  isActive!: boolean;

  @Prop({ required: true, default: 0 })
  sortOrder!: number; // For display ordering
}

export const MedalDefinitionSchema = SchemaFactory.createForClass(MedalDefinition);

// Avatar option definition (for DiceBear integration)
@Schema({ _id: false })
export class AvatarOptionDefinition {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  category!: string; // 'style' | 'skinColor' | 'hair' | 'eyes' | 'mouth' | 'accessories' | 'clothing' | 'background'

  @Prop({ required: true })
  value!: string; // The actual value for DiceBear API

  @Prop({ required: true })
  displayName!: string;

  @Prop({ required: false })
  previewUrl?: string; // Optional preview image

  @Prop({ required: true, default: 0 })
  requiredXp!: number; // XP needed to unlock (0 = free)

  @Prop({ required: true, default: 0 })
  requiredLevel!: number; // Level needed to unlock (0 = free)

  @Prop({ required: true, default: true })
  isActive!: boolean;

  @Prop({ required: true, default: 0 })
  sortOrder!: number;
}

export const AvatarOptionDefinitionSchema = SchemaFactory.createForClass(AvatarOptionDefinition);

// Main configuration document (one per school)
@Schema({ timestamps: true })
export class GamificationConfig {
  @Prop({ required: true, unique: true })
  schoolId!: string;

  @Prop({ required: true, type: XpRulesSchema, default: () => ({}) })
  xpRules!: XpRules;

  @Prop({ required: true, type: LevelConfigSchema, default: () => ({}) })
  levelConfig!: LevelConfig;

  @Prop({ required: true, type: [MedalDefinitionSchema], default: [] })
  medals!: MedalDefinition[];

  @Prop({ required: true, type: [AvatarOptionDefinitionSchema], default: [] })
  avatarOptions!: AvatarOptionDefinition[];

  @Prop({ required: true, default: true })
  isActive!: boolean;

  @Prop({ required: false })
  lastModifiedByUserId?: string;
}

export const GamificationConfigSchema = SchemaFactory.createForClass(GamificationConfig);

// Default medals to seed
export const DEFAULT_MEDALS: Omit<MedalDefinition, 'isActive' | 'sortOrder'>[] = [
  { id: 'first_test', name: 'Primer Paso', description: 'Completa tu primer test', icon: '🎯', xpReward: 25, conditionType: 'tests_completed', conditionValue: 1 },
  { id: 'tests_10', name: 'Estudiante Activo', description: 'Completa 10 tests', icon: '📝', xpReward: 50, conditionType: 'tests_completed', conditionValue: 10 },
  { id: 'tests_50', name: 'Académico', description: 'Completa 50 tests', icon: '📚', xpReward: 150, conditionType: 'tests_completed', conditionValue: 50 },
  { id: 'workshop_1', name: 'Explorador', description: 'Completa tu primer taller', icon: '🗺️', xpReward: 50, conditionType: 'workshops_completed', conditionValue: 1 },
  { id: 'workshop_5', name: 'Aventurero', description: 'Completa 5 talleres', icon: '⭐', xpReward: 100, conditionType: 'workshops_completed', conditionValue: 5 },
  { id: 'workshop_10', name: 'Dedicado', description: 'Completa 10 talleres', icon: '🌟', xpReward: 200, conditionType: 'workshops_completed', conditionValue: 10 },
  { id: 'workshop_25', name: 'Maestro', description: 'Completa 25 talleres', icon: '👑', xpReward: 500, conditionType: 'workshops_completed', conditionValue: 25 },
  { id: 'perfect_1', name: 'Perfección', description: 'Obtén 100% en un test', icon: '💎', xpReward: 30, conditionType: 'perfect_scores', conditionValue: 1 },
  { id: 'perfect_10', name: 'Genio', description: 'Obtén 100% en 10 tests', icon: '🧠', xpReward: 150, conditionType: 'perfect_scores', conditionValue: 10 },
  { id: 'streak_7', name: 'Constante', description: '7 días seguidos activo', icon: '🔥', xpReward: 100, conditionType: 'streak_days', conditionValue: 7 },
  { id: 'streak_30', name: 'Imparable', description: '30 días seguidos activo', icon: '💪', xpReward: 300, conditionType: 'streak_days', conditionValue: 30 },
  { id: 'top_10', name: 'Elite', description: 'Alcanza el Top 10', icon: '🏅', xpReward: 100, conditionType: 'ranking_position', conditionValue: 10, conditionOperator: 'lte' },
  { id: 'top_3', name: 'Podio', description: 'Alcanza el Top 3', icon: '🥉', xpReward: 200, conditionType: 'ranking_position', conditionValue: 3, conditionOperator: 'lte' },
  { id: 'first_place', name: 'Campeón', description: 'Alcanza el primer lugar', icon: '🏆', xpReward: 500, conditionType: 'ranking_position', conditionValue: 1, conditionOperator: 'eq' },
];

// Default avatar options for DiceBear (avataaars style)
export const DEFAULT_AVATAR_OPTIONS: Omit<AvatarOptionDefinition, 'isActive' | 'sortOrder'>[] = [
  // Styles (DiceBear styles)
  { id: 'style_avataaars', category: 'style', value: 'avataaars', displayName: 'Avataaars', requiredXp: 0, requiredLevel: 0 },
  { id: 'style_lorelei', category: 'style', value: 'lorelei', displayName: 'Lorelei', requiredXp: 500, requiredLevel: 5 },
  { id: 'style_notionists', category: 'style', value: 'notionists', displayName: 'Notionists', requiredXp: 1000, requiredLevel: 10 },
  { id: 'style_openPeeps', category: 'style', value: 'open-peeps', displayName: 'Open Peeps', requiredXp: 2000, requiredLevel: 15 },
  { id: 'style_pixelArt', category: 'style', value: 'pixel-art', displayName: 'Pixel Art', requiredXp: 3000, requiredLevel: 20 },
  
  // Skin colors (free)
  { id: 'skin_light', category: 'skinColor', value: 'f8d9c4', displayName: 'Claro', requiredXp: 0, requiredLevel: 0 },
  { id: 'skin_medium', category: 'skinColor', value: 'd4a574', displayName: 'Medio', requiredXp: 0, requiredLevel: 0 },
  { id: 'skin_tan', category: 'skinColor', value: 'c68642', displayName: 'Bronceado', requiredXp: 0, requiredLevel: 0 },
  { id: 'skin_dark', category: 'skinColor', value: '8d5524', displayName: 'Oscuro', requiredXp: 0, requiredLevel: 0 },
  
  // Background colors
  { id: 'bg_blue', category: 'backgroundColor', value: 'b6e3f4', displayName: 'Azul', requiredXp: 0, requiredLevel: 0 },
  { id: 'bg_green', category: 'backgroundColor', value: 'c0f4c4', displayName: 'Verde', requiredXp: 0, requiredLevel: 0 },
  { id: 'bg_purple', category: 'backgroundColor', value: 'd1c4f4', displayName: 'Morado', requiredXp: 100, requiredLevel: 2 },
  { id: 'bg_pink', category: 'backgroundColor', value: 'f4c4d4', displayName: 'Rosa', requiredXp: 100, requiredLevel: 2 },
  { id: 'bg_yellow', category: 'backgroundColor', value: 'f4e9c4', displayName: 'Amarillo', requiredXp: 200, requiredLevel: 3 },
  { id: 'bg_gradient', category: 'backgroundColor', value: 'gradient_rainbow', displayName: 'Arcoíris', requiredXp: 1000, requiredLevel: 10 },
  
  // Eyes (avataaars)
  { id: 'eyes_default', category: 'eyes', value: 'default', displayName: 'Normal', requiredXp: 0, requiredLevel: 0 },
  { id: 'eyes_happy', category: 'eyes', value: 'happy', displayName: 'Feliz', requiredXp: 0, requiredLevel: 0 },
  { id: 'eyes_wink', category: 'eyes', value: 'wink', displayName: 'Guiño', requiredXp: 50, requiredLevel: 1 },
  { id: 'eyes_surprised', category: 'eyes', value: 'surprised', displayName: 'Sorprendido', requiredXp: 100, requiredLevel: 2 },
  { id: 'eyes_hearts', category: 'eyes', value: 'hearts', displayName: 'Corazones', requiredXp: 500, requiredLevel: 5 },
  { id: 'eyes_stars', category: 'eyes', value: 'xDizzy', displayName: 'Estrellas', requiredXp: 1000, requiredLevel: 10 },
  
  // Mouth
  { id: 'mouth_smile', category: 'mouth', value: 'smile', displayName: 'Sonrisa', requiredXp: 0, requiredLevel: 0 },
  { id: 'mouth_default', category: 'mouth', value: 'default', displayName: 'Normal', requiredXp: 0, requiredLevel: 0 },
  { id: 'mouth_twinkle', category: 'mouth', value: 'twinkle', displayName: 'Brillo', requiredXp: 100, requiredLevel: 2 },
  { id: 'mouth_tongue', category: 'mouth', value: 'tongue', displayName: 'Lengua', requiredXp: 200, requiredLevel: 3 },
  
  // Accessories
  { id: 'acc_none', category: 'accessories', value: 'none', displayName: 'Ninguno', requiredXp: 0, requiredLevel: 0 },
  { id: 'acc_glasses_round', category: 'accessories', value: 'round', displayName: 'Lentes Redondos', requiredXp: 100, requiredLevel: 2 },
  { id: 'acc_glasses_square', category: 'accessories', value: 'prescription02', displayName: 'Lentes Cuadrados', requiredXp: 200, requiredLevel: 3 },
  { id: 'acc_sunglasses', category: 'accessories', value: 'sunglasses', displayName: 'Lentes de Sol', requiredXp: 500, requiredLevel: 5 },
  
  // Hair (avataaars)
  { id: 'hair_short', category: 'top', value: 'shortHairShortFlat', displayName: 'Corto', requiredXp: 0, requiredLevel: 0 },
  { id: 'hair_long', category: 'top', value: 'longHairStraight', displayName: 'Largo Lacio', requiredXp: 0, requiredLevel: 0 },
  { id: 'hair_curly', category: 'top', value: 'longHairCurly', displayName: 'Rizado', requiredXp: 100, requiredLevel: 2 },
  { id: 'hair_mohawk', category: 'top', value: 'shortHairDreads01', displayName: 'Mohawk', requiredXp: 300, requiredLevel: 4 },
  { id: 'hair_bun', category: 'top', value: 'longHairBun', displayName: 'Chongo', requiredXp: 200, requiredLevel: 3 },
];
