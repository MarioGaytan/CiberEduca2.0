import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SchoolAvatarConfigDocument = SchoolAvatarConfig & Document;

/**
 * Configuration for a single avatar option unlock requirement
 * Stored as individual documents for efficient querying and updates
 */
@Schema({ timestamps: true })
export class SchoolAvatarConfig {
  @Prop({ required: true, index: true })
  schoolId!: string;

  @Prop({ required: true, index: true })
  styleId!: string; // DiceBear style id (e.g., 'avataaars', 'adventurer')

  @Prop({ required: true, index: true })
  category!: string; // 'style' | 'skinColor' | 'hair' | 'eyes' | etc.

  @Prop({ required: true })
  optionValue!: string; // The actual value for DiceBear API

  @Prop({ required: true })
  displayName!: string;

  @Prop({ required: true, default: 0, index: true })
  requiredXp!: number; // XP needed to unlock (0 = free)

  @Prop({ required: true, default: 0, index: true })
  requiredLevel!: number; // Level needed to unlock (0 = free)

  @Prop({ required: true, default: true, index: true })
  isActive!: boolean;

  @Prop({ required: true, default: 0 })
  sortOrder!: number;

  @Prop({ required: false })
  previewUrl?: string;

  @Prop({ required: false })
  lastModifiedBy?: string;
}

export const SchoolAvatarConfigSchema =
  SchemaFactory.createForClass(SchoolAvatarConfig);

// Compound indexes for optimized queries
// Index for getting all configs for a school+style combination
SchoolAvatarConfigSchema.index({ schoolId: 1, styleId: 1, category: 1 });

// Index for getting unlocked options (filtering by XP/Level)
SchoolAvatarConfigSchema.index({
  schoolId: 1,
  styleId: 1,
  requiredXp: 1,
  requiredLevel: 1,
});

// Unique index to prevent duplicates
SchoolAvatarConfigSchema.index(
  { schoolId: 1, styleId: 1, category: 1, optionValue: 1 },
  { unique: true },
);

// Index for category-based queries across all styles
SchoolAvatarConfigSchema.index({ schoolId: 1, category: 1, isActive: 1 });
