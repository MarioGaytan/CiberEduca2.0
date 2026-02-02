import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SchoolMedalConfigDocument = SchoolMedalConfig & Document;

/**
 * Medal configuration per school
 * Stored as individual documents for efficient querying
 */
@Schema({ timestamps: true })
export class SchoolMedalConfig {
  @Prop({ required: true, index: true })
  schoolId!: string;

  @Prop({ required: true })
  medalId!: string; // Unique identifier within school

  @Prop({ required: true })
  name!: string; // Display name

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  icon!: string; // Emoji, Lucide icon name, or SVG string

  @Prop({ required: false, default: 'emoji' })
  iconType?: string; // 'emoji' | 'lucide' | 'svg'

  @Prop({ required: false })
  iconColor?: string; // Hex color for icon

  @Prop({ required: false })
  bgColor?: string; // Hex color for background

  @Prop({ required: true, default: 0 })
  xpReward!: number; // XP granted when earned

  @Prop({ required: true })
  conditionType!: string; // 'workshops_completed' | 'tests_completed' | etc.

  @Prop({ required: true })
  conditionValue!: number; // e.g., 5 for "complete 5 workshops"

  @Prop({ required: false, default: 'gte' })
  conditionOperator?: string; // 'gte' | 'lte' | 'eq'

  @Prop({ required: true, default: true, index: true })
  isActive!: boolean;

  @Prop({ required: true, default: 0 })
  sortOrder!: number;

  @Prop({ required: false })
  lastModifiedBy?: string;
}

export const SchoolMedalConfigSchema = SchemaFactory.createForClass(SchoolMedalConfig);

// Compound indexes for optimized queries
// Index for getting all medals for a school
SchoolMedalConfigSchema.index({ schoolId: 1, isActive: 1, sortOrder: 1 });

// Unique index to prevent duplicate medal IDs within a school
SchoolMedalConfigSchema.index({ schoolId: 1, medalId: 1 }, { unique: true });

// Index for condition-based queries (checking which medals to award)
SchoolMedalConfigSchema.index({ schoolId: 1, conditionType: 1, conditionValue: 1 });
