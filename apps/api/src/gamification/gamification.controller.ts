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
import { UpsertMedalDto } from './dto/upsert-medal.dto';
import { ReorderMedalsDto } from './dto/reorder-medals.dto';

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
    const schoolId = req.user.schoolId ?? 'default';
    const config = await this.gamificationService.getFullConfig(schoolId);
    return config.medals;
  }

  /**
   * Create or update a medal
   */
  @Roles(Role.Admin, Role.ExperienceManager)
  @Post('medals')
  async upsertMedal(
    @Req() req: { user: any },
    @Body() medal: UpsertMedalDto,
  ) {
    const schoolId = req.user.schoolId ?? 'default';
    return this.gamificationService.upsertMedal(schoolId, medal as MedalDefinition, req.user.userId);
  }

  /**
   * Reorder medals
   */
  @Roles(Role.Admin, Role.ExperienceManager)
  @Put('medals/reorder')
  async reorderMedals(
    @Req() req: { user: any },
    @Body() dto: ReorderMedalsDto,
  ) {
    const schoolId = req.user.schoolId ?? 'default';
    await this.gamificationService.reorderMedals(schoolId, dto.medalIds, req.user.userId);
    return { success: true };
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

  // ========== DICEBEAR STYLES ENDPOINTS ==========

  /**
   * Get all DiceBear styles (public list)
   */
  @Roles(Role.Student, Role.Teacher, Role.Admin, Role.ExperienceManager)
  @Get('dicebear/styles')
  async getDiceBearStyles() {
    return this.gamificationService.getDiceBearStyles(true);
  }

  /**
   * Get all DiceBear styles with user unlock status
   */
  @Roles(Role.Student, Role.Teacher, Role.Admin, Role.ExperienceManager)
  @Get('dicebear/styles/user/:xp/:level')
  async getStylesForUser(
    @Req() req: { user: any },
    @Param('xp') xp: string,
    @Param('level') level: string,
  ) {
    const schoolId = req.user.schoolId ?? 'default';
    return this.gamificationService.getAllStylesForUser(
      schoolId,
      parseInt(xp, 10) || 0,
      parseInt(level, 10) || 1,
    );
  }

  /**
   * Get a single DiceBear style with all options
   */
  @Roles(Role.Student, Role.Teacher, Role.Admin, Role.ExperienceManager)
  @Get('dicebear/styles/:styleId')
  async getDiceBearStyle(@Param('styleId') styleId: string) {
    return this.gamificationService.getDiceBearStyle(styleId);
  }

  /**
   * Get style options with unlock status for user
   */
  @Roles(Role.Student, Role.Teacher, Role.Admin, Role.ExperienceManager)
  @Get('dicebear/styles/:styleId/user/:xp/:level')
  async getStyleOptionsForUser(
    @Req() req: { user: any },
    @Param('styleId') styleId: string,
    @Param('xp') xp: string,
    @Param('level') level: string,
  ) {
    const schoolId = req.user.schoolId ?? 'default';
    return this.gamificationService.getStyleOptionsForUser(
      schoolId,
      styleId,
      parseInt(xp, 10) || 0,
      parseInt(level, 10) || 1,
    );
  }

  /**
   * Update DiceBear style settings (admin only)
   */
  @Roles(Role.Admin, Role.ExperienceManager)
  @Put('dicebear/styles/:styleId')
  async updateDiceBearStyle(
    @Param('styleId') styleId: string,
    @Body() updates: { isActive?: boolean; sortOrder?: number },
  ) {
    return this.gamificationService.updateDiceBearStyle(styleId, updates);
  }

  // ========== OPTIMIZED AVATAR CONFIG ENDPOINTS ==========

  /**
   * Get avatar configs for a specific style (admin)
   */
  @Roles(Role.Admin, Role.ExperienceManager)
  @Get('avatar-configs/:styleId')
  async getAvatarConfigsForStyle(
    @Req() req: { user: any },
    @Param('styleId') styleId: string,
  ) {
    const schoolId = req.user.schoolId ?? 'default';
    return this.gamificationService.getAvatarConfigsForStyle(schoolId, styleId);
  }

  /**
   * Update style unlock requirements
   */
  @Roles(Role.Admin, Role.ExperienceManager)
  @Put('avatar-configs/:styleId/unlock')
  async updateStyleUnlock(
    @Req() req: { user: any },
    @Param('styleId') styleId: string,
    @Body() body: { requiredXp: number; requiredLevel: number },
  ) {
    const schoolId = req.user.schoolId ?? 'default';
    return this.gamificationService.updateStyleUnlockConfig(
      schoolId,
      styleId,
      body.requiredXp,
      body.requiredLevel,
      req.user.userId,
    );
  }

  /**
   * Bulk update avatar option configs for a style
   */
  @Roles(Role.Admin, Role.ExperienceManager)
  @Post('avatar-configs/:styleId/bulk')
  async bulkUpdateAvatarConfigs(
    @Req() req: { user: any },
    @Param('styleId') styleId: string,
    @Body() body: {
      configs: Array<{
        category: string;
        optionValue: string;
        displayName: string;
        requiredXp: number;
        requiredLevel: number;
        isActive?: boolean;
        sortOrder?: number;
      }>;
    },
  ) {
    const schoolId = req.user.schoolId ?? 'default';
    return this.gamificationService.bulkUpsertAvatarConfigs(
      schoolId,
      styleId,
      body.configs,
      req.user.userId,
    );
  }

  // ========== OPTIMIZED MEDAL CONFIG ENDPOINTS ==========

  /**
   * Get all medals for school (optimized)
   */
  @Roles(Role.Admin, Role.ExperienceManager)
  @Get('medal-configs')
  async getMedalConfigs(@Req() req: { user: any }) {
    const schoolId = req.user.schoolId ?? 'default';
    return this.gamificationService.getMedalsForSchool(schoolId, false);
  }

  /**
   * Upsert a medal config
   */
  @Roles(Role.Admin, Role.ExperienceManager)
  @Post('medal-configs')
  async upsertMedalConfig(
    @Req() req: { user: any },
    @Body() body: {
      medalId: string;
      name: string;
      description: string;
      icon: string;
      iconType?: string;
      iconColor?: string;
      bgColor?: string;
      xpReward: number;
      conditionType: string;
      conditionValue: number;
      conditionOperator?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    const schoolId = req.user.schoolId ?? 'default';
    return this.gamificationService.upsertMedalConfig(
      schoolId,
      body.medalId,
      body,
      req.user.userId,
    );
  }

  /**
   * Delete a medal config
   */
  @Roles(Role.Admin, Role.ExperienceManager)
  @Delete('medal-configs/:medalId')
  async deleteMedalConfig(
    @Req() req: { user: any },
    @Param('medalId') medalId: string,
  ) {
    const schoolId = req.user.schoolId ?? 'default';
    await this.gamificationService.deleteMedalConfig(schoolId, medalId);
    return { success: true };
  }

  /**
   * Seed default medals
   */
  @Roles(Role.Admin)
  @Post('medal-configs/seed-defaults')
  async seedDefaultMedals(@Req() req: { user: any }) {
    const schoolId = req.user.schoolId ?? 'default';
    return this.gamificationService.seedDefaultMedals(schoolId, req.user.userId);
  }
}
