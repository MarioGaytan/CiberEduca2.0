import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/roles.enum';
import { GamificationService } from './gamification.service';
import {
  MedalDefinition,
  AvatarOptionDefinition,
  XpRules,
  LevelConfig,
} from './schemas/gamification-config.schema';

@Controller('gamification')
@UseGuards(JwtAccessGuard, RolesGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  // ========== PUBLIC ENDPOINTS (for students) ==========

  /**
   * Get unlocked avatar options for current user
   */
  @Roles(Role.Student, Role.Teacher, Role.Admin, Role.ExperienceManager)
  @Get('avatar-options')
  async getMyAvatarOptions(@Req() req: { user: any }) {
    // This would need user's XP and level - for now return all unlocked based on 0 XP
    // In real usage, this should be called with user's actual XP
    const schoolId = req.user.schoolId ?? 'default';
    return this.gamificationService.getUnlockedAvatarOptions(schoolId, 0, 1);
  }

  /**
   * Get avatar options for a specific XP/level (used by profile page)
   */
  @Roles(Role.Student, Role.Teacher, Role.Admin, Role.ExperienceManager)
  @Get('avatar-options/:xp/:level')
  async getAvatarOptionsForLevel(
    @Req() req: { user: any },
    @Param('xp') xp: string,
    @Param('level') level: string,
  ) {
    const schoolId = req.user.schoolId ?? 'default';
    return this.gamificationService.getUnlockedAvatarOptions(
      schoolId,
      parseInt(xp, 10) || 0,
      parseInt(level, 10) || 1,
    );
  }

  // ========== ADMIN/EXPERIENCE_MANAGER ENDPOINTS ==========

  /**
   * Get full gamification config
   */
  @Roles(Role.Admin, Role.ExperienceManager)
  @Get('config')
  async getConfig(@Req() req: { user: any }) {
    const schoolId = req.user.schoolId ?? 'default';
    return this.gamificationService.getFullConfig(schoolId);
  }

  /**
   * Update XP rules
   */
  @Roles(Role.Admin, Role.ExperienceManager)
  @Put('config/xp-rules')
  async updateXpRules(
    @Req() req: { user: any },
    @Body() rules: Partial<XpRules>,
  ) {
    const schoolId = req.user.schoolId ?? 'default';
    return this.gamificationService.updateXpRules(schoolId, rules, req.user.userId);
  }

  /**
   * Update level config
   */
  @Roles(Role.Admin, Role.ExperienceManager)
  @Put('config/level')
  async updateLevelConfig(
    @Req() req: { user: any },
    @Body() levelConfig: Partial<LevelConfig>,
  ) {
    const schoolId = req.user.schoolId ?? 'default';
    return this.gamificationService.updateLevelConfig(schoolId, levelConfig, req.user.userId);
  }

  /**
   * Get all medals
   */
  @Roles(Role.Admin, Role.ExperienceManager)
  @Get('medals')
  async getMedals(@Req() req: { user: any }) {
    const config = await this.gamificationService.getFullConfig(req.user.schoolId);
    return config.medals;
  }

  /**
   * Create or update a medal
   */
  @Roles(Role.Admin, Role.ExperienceManager)
  @Post('medals')
  async upsertMedal(
    @Req() req: { user: any },
    @Body() medal: MedalDefinition,
  ) {
    const schoolId = req.user.schoolId ?? 'default';
    return this.gamificationService.upsertMedal(schoolId, medal, req.user.userId);
  }

  /**
   * Delete a medal
   */
  @Roles(Role.Admin, Role.ExperienceManager)
  @Delete('medals/:id')
  async deleteMedal(
    @Req() req: { user: any },
    @Param('id') id: string,
  ) {
    const schoolId = req.user.schoolId ?? 'default';
    await this.gamificationService.deleteMedal(schoolId, id, req.user.userId);
    return { success: true };
  }

  /**
   * Get all avatar options (admin view)
   */
  @Roles(Role.Admin, Role.ExperienceManager)
  @Get('avatar-options/all')
  async getAllAvatarOptions(@Req() req: { user: any }) {
    const schoolId = req.user.schoolId ?? 'default';
    return this.gamificationService.getAllAvatarOptions(schoolId);
  }

  /**
   * Create or update an avatar option
   */
  @Roles(Role.Admin, Role.ExperienceManager)
  @Post('avatar-options')
  async upsertAvatarOption(
    @Req() req: { user: any },
    @Body() option: AvatarOptionDefinition,
  ) {
    const schoolId = req.user.schoolId ?? 'default';
    return this.gamificationService.upsertAvatarOption(schoolId, option, req.user.userId);
  }

  /**
   * Delete an avatar option
   */
  @Roles(Role.Admin, Role.ExperienceManager)
  @Delete('avatar-options/:id')
  async deleteAvatarOption(
    @Req() req: { user: any },
    @Param('id') id: string,
  ) {
    const schoolId = req.user.schoolId ?? 'default';
    await this.gamificationService.deleteAvatarOption(schoolId, id, req.user.userId);
    return { success: true };
  }

  /**
   * Reset all config to defaults
   */
  @Roles(Role.Admin)
  @Post('config/reset')
  async resetToDefaults(@Req() req: { user: any }) {
    const schoolId = req.user.schoolId ?? 'default';
    return this.gamificationService.resetToDefaults(schoolId, req.user.userId);
  }
}
