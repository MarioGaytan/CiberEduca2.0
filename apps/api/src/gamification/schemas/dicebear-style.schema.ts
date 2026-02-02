import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DiceBearStyleDocument = DiceBearStyle & Document;

// Individual option within a category
@Schema({ _id: false })
export class DiceBearOptionValue {
  @Prop({ required: true })
  value!: string; // e.g., 'variant01', 'long01', 'short01'

  @Prop({ required: true })
  displayName!: string; // Nombre para mostrar

  @Prop({ required: false })
  previewSeed?: string; // Seed to generate preview
}

export const DiceBearOptionValueSchema = SchemaFactory.createForClass(DiceBearOptionValue);

// Category of options (e.g., hair, eyes, mouth)
@Schema({ _id: false })
export class DiceBearCategory {
  @Prop({ required: true })
  name!: string; // e.g., 'hair', 'eyes', 'mouth', 'skinColor'

  @Prop({ required: true })
  displayName!: string; // e.g., 'Cabello', 'Ojos', 'Boca'

  @Prop({ required: true })
  type!: string; // 'array' | 'color' | 'boolean' | 'integer'

  @Prop({ required: false })
  isColor?: boolean; // If this is a color picker

  @Prop({ required: false })
  colorPattern?: string; // Regex pattern for colors

  @Prop({ required: false, type: [DiceBearOptionValueSchema], default: [] })
  options!: DiceBearOptionValue[]; // Available values

  @Prop({ required: false })
  min?: number; // For integer types

  @Prop({ required: false })
  max?: number; // For integer types

  @Prop({ required: true, default: 0 })
  sortOrder!: number;
}

export const DiceBearCategorySchema = SchemaFactory.createForClass(DiceBearCategory);

// Main DiceBear style document
@Schema({ timestamps: true })
export class DiceBearStyle {
  @Prop({ required: true, unique: true })
  styleId!: string; // e.g., 'adventurer', 'avataaars'

  @Prop({ required: true })
  displayName!: string; // e.g., 'Adventurer', 'Avataaars'

  @Prop({ required: false })
  description?: string;

  @Prop({ required: false })
  styleCategory?: string; // 'characters' | 'minimalist'

  @Prop({ required: false })
  creator?: string;

  @Prop({ required: false })
  license?: string;

  @Prop({ required: true })
  apiUrl!: string; // e.g., 'https://api.dicebear.com/9.x/adventurer/svg'

  @Prop({ required: false })
  schemaUrl?: string; // JSON schema URL

  @Prop({ required: true, type: [DiceBearCategorySchema], default: [] })
  categories!: DiceBearCategory[];

  @Prop({ required: true, default: true })
  isActive!: boolean;

  @Prop({ required: true, default: 0 })
  sortOrder!: number;

  @Prop({ required: false })
  lastSyncedAt?: Date;
}

export const DiceBearStyleSchema = SchemaFactory.createForClass(DiceBearStyle);

// Index for quick lookups (styleId already indexed via unique: true)
DiceBearStyleSchema.index({ isActive: 1, sortOrder: 1 });
