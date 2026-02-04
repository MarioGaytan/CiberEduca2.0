import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { WorkshopStatus, WorkshopVisibility } from '../workshop.enums';

export type WorkshopDocument = Workshop & Document;

// Content block types for rich content
export enum ContentBlockType {
  Text = 'text',
  YouTube = 'youtube',
  Image = 'image',
  Heading = 'heading',
}

@Schema({ _id: false })
export class ContentBlock {
  @Prop({ required: true, enum: ContentBlockType })
  type!: ContentBlockType;

  @Prop({ required: false, trim: true, maxlength: 10000 })
  content?: string; // For text/heading blocks

  @Prop({ required: false, trim: true })
  url?: string; // For youtube/image blocks

  @Prop({ required: false, trim: true, maxlength: 200 })
  caption?: string; // Optional caption for media

  @Prop({ required: false })
  createdByUserId?: string; // Who created this block

  @Prop({ required: false })
  createdAt?: Date;

  @Prop({ required: false })
  lastModifiedByUserId?: string; // Who last modified

  @Prop({ required: false })
  lastModifiedAt?: Date;
}

export const ContentBlockSchema = SchemaFactory.createForClass(ContentBlock);

// Collaborator role on a workshop
export enum CollaboratorRole {
  Editor = 'editor',
  Viewer = 'viewer',
}

@Schema({ _id: false })
export class Collaborator {
  @Prop({ required: true })
  userId!: string;

  @Prop({
    required: true,
    enum: CollaboratorRole,
    default: CollaboratorRole.Viewer,
  })
  role!: CollaboratorRole;

  @Prop({ required: false })
  addedAt?: Date;

  @Prop({ required: false })
  addedByUserId?: string;
}

export const CollaboratorSchema = SchemaFactory.createForClass(Collaborator);

// History entry for tracking changes
@Schema({ _id: false })
export class HistoryEntry {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  action!: string; // 'created', 'updated', 'submitted', 'approved', 'rejected', 'edit_requested', 'delete_requested'

  @Prop({ required: false })
  details?: string;

  @Prop({ required: true })
  timestamp!: Date;
}

export const HistoryEntrySchema = SchemaFactory.createForClass(HistoryEntry);

@Schema({ timestamps: true })
export class Workshop {
  @Prop({ required: true })
  schoolId!: string;

  @Prop({ required: true })
  createdByUserId!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  title!: string;

  @Prop({ required: false, trim: true, maxlength: 500 })
  description?: string; // Short description/summary

  @Prop({ required: false, trim: true })
  coverImageUrl?: string; // Cover/thumbnail image

  @Prop({ required: false, type: [String], default: [] })
  objectives?: string[]; // Learning objectives

  @Prop({ required: false, min: 1, max: 480 })
  estimatedMinutes?: number; // Estimated duration

  @Prop({ required: false, type: [ContentBlockSchema], default: [] })
  content?: ContentBlock[]; // Rich content blocks

  @Prop({ required: true, enum: WorkshopStatus, default: WorkshopStatus.Draft })
  status!: WorkshopStatus;

  @Prop({
    required: true,
    enum: WorkshopVisibility,
    default: WorkshopVisibility.Internal,
  })
  visibility!: WorkshopVisibility;

  @Prop({ required: false })
  accessCodeHash?: string;

  @Prop({ required: false })
  reviewerFeedback?: string;

  @Prop({ required: false })
  approvedByUserId?: string;

  @Prop({ required: false })
  approvedAt?: Date;

  // Collaborators system
  @Prop({ required: false, type: [CollaboratorSchema], default: [] })
  collaborators?: Collaborator[];

  // History/audit log
  @Prop({ required: false, type: [HistoryEntrySchema], default: [] })
  history?: HistoryEntry[];

  // Soft delete
  @Prop({ required: false, default: false })
  isDeleted?: boolean;

  @Prop({ required: false })
  deletedAt?: Date;

  @Prop({ required: false })
  deletedByUserId?: string;

  // Edit request (when approved workshop needs changes)
  @Prop({ required: false, default: false })
  editRequested?: boolean;

  @Prop({ required: false })
  editRequestedAt?: Date;

  @Prop({ required: false })
  editRequestedByUserId?: string;

  @Prop({ required: false })
  editRequestReason?: string;

  // Delete request (pending deletion approval)
  @Prop({ required: false, default: false })
  deleteRequested?: boolean;

  @Prop({ required: false })
  deleteRequestedAt?: Date;

  @Prop({ required: false })
  deleteRequestedByUserId?: string;

  @Prop({ required: false })
  deleteRequestReason?: string;
}

export const WorkshopSchema = SchemaFactory.createForClass(Workshop);
