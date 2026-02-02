import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import {
  GamificationConfig,
  GamificationConfigSchema,
} from './schemas/gamification-config.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GamificationConfig.name, schema: GamificationConfigSchema },
    ]),
  ],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
