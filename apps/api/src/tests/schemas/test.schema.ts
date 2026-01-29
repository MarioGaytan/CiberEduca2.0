import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { QuestionType, TestStatus } from '../test.enums';

export type TestDocument = Test & Document;

@Schema({ _id: false })
export class TestQuestionOption {
  @Prop({ required: true, trim: true, maxlength: 300 })
  text!: string;
}

export const TestQuestionOptionSchema = SchemaFactory.createForClass(TestQuestionOption);

@Schema({ _id: false })
export class TestQuestion {
  @Prop({ required: true, enum: QuestionType })
  type!: QuestionType;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  prompt!: string;

  @Prop({ required: true, min: 0, max: 100 })
  points!: number;

  @Prop({ required: false, type: [TestQuestionOptionSchema] })
  options?: TestQuestionOption[];

  @Prop({ required: false, min: 0 })
  correctOptionIndex?: number;
}

export const TestQuestionSchema = SchemaFactory.createForClass(TestQuestion);

@Schema({ timestamps: true })
export class Test {
  @Prop({ required: true })
  schoolId!: string;

  @Prop({ required: true })
  workshopId!: string;

  @Prop({ required: true })
  createdByUserId!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  title!: string;

  @Prop({ required: false, trim: true, maxlength: 2000 })
  description?: string;

  @Prop({ required: true, enum: TestStatus, default: TestStatus.Draft })
  status!: TestStatus;

  @Prop({ required: false })
  reviewerFeedback?: string;

  @Prop({ required: false })
  approvedByUserId?: string;

  @Prop({ required: false })
  approvedAt?: Date;

  @Prop({ required: true, type: [TestQuestionSchema], default: [] })
  questions!: TestQuestion[];
}

export const TestSchema = SchemaFactory.createForClass(Test);
