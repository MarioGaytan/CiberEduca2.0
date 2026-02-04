import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestSchema } from '../tests/schemas/test.schema';
import {
  TestAttempt,
  TestAttemptSchema,
} from '../tests/schemas/test-attempt.schema';
import { Workshop, WorkshopSchema } from '../workshops/schemas/workshop.schema';
import {
  StudentProgress,
  StudentProgressSchema,
} from './schemas/student-progress.schema';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentProgress.name, schema: StudentProgressSchema },
      { name: Test.name, schema: TestSchema },
      { name: TestAttempt.name, schema: TestAttemptSchema },
      { name: Workshop.name, schema: WorkshopSchema },
    ]),
    forwardRef(() => GamificationModule),
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
