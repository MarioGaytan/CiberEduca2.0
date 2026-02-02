import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressModule } from '../progress/progress.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Workshop, WorkshopSchema } from '../workshops/schemas/workshop.schema';
import { TestAttempt, TestAttemptSchema } from './schemas/test-attempt.schema';
import { Test, TestSchema } from './schemas/test.schema';
import { TestsController } from './tests.controller';
import { TestsService } from './tests.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Test.name, schema: TestSchema },
      { name: TestAttempt.name, schema: TestAttemptSchema },
      { name: Workshop.name, schema: WorkshopSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => ProgressModule),
  ],
  controllers: [TestsController],
  providers: [TestsService],
  exports: [TestsService],
})
export class TestsModule {}
