import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Workshop, WorkshopSchema } from './schemas/workshop.schema';
import { WorkshopsController } from './workshops.controller';
import { WorkshopsService } from './workshops.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Workshop.name, schema: WorkshopSchema }]),
  ],
  controllers: [WorkshopsController],
  providers: [WorkshopsService],
})
export class WorkshopsModule {}
