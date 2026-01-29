import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
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
    ]),
  ],
  controllers: [TestsController],
  providers: [TestsService],
})
export class TestsModule {}
