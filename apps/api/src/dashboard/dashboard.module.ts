import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Workshop, WorkshopSchema } from '../workshops/schemas/workshop.schema';
import { Test, TestSchema } from '../tests/schemas/test.schema';
import {
  TestAttempt,
  TestAttemptSchema,
} from '../tests/schemas/test-attempt.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Workshop.name, schema: WorkshopSchema },
      { name: Test.name, schema: TestSchema },
      { name: TestAttempt.name, schema: TestAttemptSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
