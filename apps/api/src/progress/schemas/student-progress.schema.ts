import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type StudentProgressDocument = StudentProgress & Document;

// Medal types
export enum MedalType {
  FirstWorkshop = 'first_workshop',
  Workshop5 = 'workshop_5',
  Workshop10 = 'workshop_10',
  Workshop25 = 'workshop_25',
  PerfectScore = 'perfect_score',
  Streak7 = 'streak_7',
  Streak30 = 'streak_30',
  Top10 = 'top_10',
  Top3 = 'top_3',
  FirstPlace = 'first_place',
}

// Medal metadata for display
export const MEDAL_INFO: Record<MedalType, { name: string; description: string; icon: string; xp: number }> = {
  [MedalType.FirstWorkshop]: { name: 'Primer Paso', description: 'Completaste tu primer taller', icon: '🎯', xp: 50 },
  [MedalType.Workshop5]: { name: 'En Racha', description: 'Completaste 5 talleres', icon: '⭐', xp: 100 },
  [MedalType.Workshop10]: { name: 'Dedicado', description: 'Completaste 10 talleres', icon: '🌟', xp: 200 },
  [MedalType.Workshop25]: { name: 'Maestro', description: 'Completaste 25 talleres', icon: '👑', xp: 500 },
  [MedalType.PerfectScore]: { name: 'Perfección', description: 'Obtuviste 100% en un test', icon: '💎', xp: 75 },
  [MedalType.Streak7]: { name: 'Constante', description: '7 días seguidos activo', icon: '🔥', xp: 100 },
  [MedalType.Streak30]: { name: 'Imparable', description: '30 días seguidos activo', icon: '💪', xp: 300 },
  [MedalType.Top10]: { name: 'Elite', description: 'Top 10 del ranking', icon: '🏅', xp: 150 },
  [MedalType.Top3]: { name: 'Podio', description: 'Top 3 del ranking', icon: '🥉', xp: 250 },
  [MedalType.FirstPlace]: { name: 'Campeón', description: 'Primer lugar del ranking', icon: '🏆', xp: 500 },
};

@Schema({ _id: false })
export class Medal {
  @Prop({ required: true })
  type!: string; // Can be MedalType enum value or dynamic medal ID

  @Prop({ required: false })
  workshopId?: string;

  @Prop({ required: true, default: () => new Date() })
  earnedAt!: Date;
}

export const MedalSchema = SchemaFactory.createForClass(Medal);

// AvatarConfig is now a Mixed type to support dynamic DiceBear properties
// Each DiceBear style has different properties (hair, facialHair, glasses, etc.)
// Using Mixed allows any properties to be saved without schema restrictions
export type AvatarConfig = {
  style: string;
  [key: string]: string | undefined;
};

export const AvatarConfigSchema = new MongooseSchema(
  {
    style: { type: String, required: true, default: 'avataaars' },
  },
  { _id: false, strict: false, minimize: false }
);

@Schema({ _id: false })
export class TestCompletion {
  @Prop({ required: true })
  testId!: string;

  @Prop({ required: true })
  workshopId!: string;

  @Prop({ required: true, default: 0 })
  bestScore!: number; // Best score achieved

  @Prop({ required: true, default: 0 })
  maxScore!: number; // Max possible score

  @Prop({ required: true, default: 0 })
  xpEarned!: number; // XP earned from this test (based on best score)

  @Prop({ required: true })
  firstCompletedAt!: Date;

  @Prop({ required: true })
  lastAttemptAt!: Date;

  @Prop({ required: true, default: 1 })
  attemptCount!: number;
}

export const TestCompletionSchema = SchemaFactory.createForClass(TestCompletion);

@Schema({ _id: false })
export class WorkshopCompletion {
  @Prop({ required: true })
  workshopId!: string;

  @Prop({ required: true })
  completedAt!: Date;

  @Prop({ required: true, default: 0 })
  totalScore!: number; // sum of all test scores in this workshop

  @Prop({ required: true, default: 0 })
  maxPossibleScore!: number;
}

export const WorkshopCompletionSchema = SchemaFactory.createForClass(WorkshopCompletion);

@Schema({ timestamps: true })
export class StudentProgress {
  @Prop({ required: true, unique: true })
  userId!: string;

  @Prop({ required: true })
  schoolId!: string;

  @Prop({ required: true })
  username!: string; // denormalized for ranking queries

  @Prop({ required: true, default: 0 })
  totalXp!: number;

  @Prop({ required: true, default: 0 })
  workshopsCompletedCount!: number;

  @Prop({ required: true, default: 0 })
  testsCompletedCount!: number;

  @Prop({ required: true, type: [WorkshopCompletionSchema], default: [] })
  workshopsCompleted!: WorkshopCompletion[];

  @Prop({ required: true, type: [TestCompletionSchema], default: [] })
  testsCompleted!: TestCompletion[]; // Detailed test completions with XP tracking

  @Prop({ required: true, type: [MedalSchema], default: [] })
  medals!: Medal[];

  @Prop({ required: true, type: AvatarConfigSchema, default: () => ({}) })
  avatar!: AvatarConfig;

  @Prop({ required: true, default: 0 })
  currentStreak!: number; // consecutive days

  @Prop({ required: true, default: 0 })
  longestStreak!: number;

  @Prop({ required: false })
  lastActivityAt?: Date;
}

export const StudentProgressSchema = SchemaFactory.createForClass(StudentProgress);

// Index for ranking queries
StudentProgressSchema.index({ schoolId: 1, totalXp: -1 });
