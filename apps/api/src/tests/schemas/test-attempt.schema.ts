import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TestAttemptDocument = TestAttempt & Document;

@Schema({ _id: false })
export class AttemptAnswer {
  @Prop({ required: true, min: 0 })
  questionIndex!: number;

  @Prop({ required: false })
  selectedOptionIndex?: number;

  @Prop({ required: false, trim: true, maxlength: 5000 })
  textAnswer?: string;

  @Prop({ required: false, min: 0, max: 100 })
  awardedPoints?: number;
}

export const AttemptAnswerSchema = SchemaFactory.createForClass(AttemptAnswer);

@Schema({ timestamps: true })
export class TestAttempt {
  @Prop({ required: true })
  schoolId!: string;

  @Prop({ required: true })
  testId!: string;

  @Prop({ required: true })
  workshopId!: string;

  @Prop({ required: true })
  studentUserId!: string;

  @Prop({ required: true, type: [AttemptAnswerSchema], default: [] })
  answers!: AttemptAnswer[];

  @Prop({ required: true, default: 0 })
  autoScore!: number;

  @Prop({ required: true, default: 0 })
  manualScore!: number;

  @Prop({ required: true, default: 0 })
  totalScore!: number;

  @Prop({ required: true, default: false })
  needsManualReview!: boolean;

  @Prop({ required: true, default: false })
  isSubmitted!: boolean;

  @Prop({ required: false })
  submittedAt?: Date;

  @Prop({ required: false })
  gradedByUserId?: string;

  @Prop({ required: false })
  gradedAt?: Date;
}

export const TestAttemptSchema = SchemaFactory.createForClass(TestAttempt);
