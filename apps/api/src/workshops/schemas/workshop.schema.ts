import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { WorkshopStatus, WorkshopVisibility } from '../workshop.enums';

export type WorkshopDocument = Workshop & Document;

@Schema({ timestamps: true })
export class Workshop {
  @Prop({ required: true })
  schoolId!: string;

  @Prop({ required: true })
  createdByUserId!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  title!: string;

  @Prop({ required: false, trim: true, maxlength: 2000 })
  description?: string;

  @Prop({ required: true, enum: WorkshopStatus, default: WorkshopStatus.Draft })
  status!: WorkshopStatus;

  @Prop({ required: true, enum: WorkshopVisibility, default: WorkshopVisibility.Internal })
  visibility!: WorkshopVisibility;

  @Prop({ required: false })
  accessCodeHash?: string;

  @Prop({ required: false })
  reviewerFeedback?: string;

  @Prop({ required: false })
  approvedByUserId?: string;

  @Prop({ required: false })
  approvedAt?: Date;
}

export const WorkshopSchema = SchemaFactory.createForClass(Workshop);
