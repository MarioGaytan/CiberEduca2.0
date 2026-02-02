import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import {
  GamificationConfig,
  GamificationConfigSchema,
} from './schemas/gamification-config.schema';
import {
  DiceBearStyle,
  DiceBearStyleSchema,
} from './schemas/dicebear-style.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GamificationConfig.name, schema: GamificationConfigSchema },
      { name: DiceBearStyle.name, schema: DiceBearStyleSchema },
    ]),
  ],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
