import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  GamificationConfig,
  GamificationConfigDocument,
  MedalDefinition,
  AvatarOptionDefinition,
  XpRules,
  LevelConfig,
  DEFAULT_MEDALS,
  DEFAULT_AVATAR_OPTIONS,
} from './schemas/gamification-config.schema';

@Injectable()
export class GamificationService {
  constructor(
    private readonly config: ConfigService,
    @InjectModel(GamificationConfig.name)
    private readonly configModel: Model<GamificationConfigDocument>,
  ) {}

  private getDefaultSchoolId(): string {
    return this.config.get<string>('DEFAULT_SCHOOL_ID') ?? 'default';
  }

  /**
   * Get or create gamification config for a school
   */
  async getConfig(schoolId?: string): Promise<GamificationConfigDocument> {
    const id = schoolId ?? this.getDefaultSchoolId();
    
    let config = await this.configModel.findOne({ schoolId: id }).exec();
    
    if (!config) {
      // Create default config
      config = await this.configModel.create({
        schoolId: id,
        xpRules: {
          testBaseXp: 0,
          testPointMultiplier: 1,
          testPerfectBonus: 20,
          workshopCompletionXp: 50,
          dailyStreakXp: 5,
          weeklyStreakBonus: 50,
          monthlyStreakBonus: 200,
        },
        levelConfig: {
          baseXpPerLevel: 100,
          levelMultiplier: 1.2,
          maxLevel: 50,
        },
        medals: DEFAULT_MEDALS.map((m, i) => ({ ...m, isActive: true, sortOrder: i })),
        avatarOptions: DEFAULT_AVATAR_OPTIONS.map((a, i) => ({ ...a, isActive: true, sortOrder: i })),
        isActive: true,
      });
    }
    
    return config;
  }

  /**
   * Calculate XP for a test attempt
   */
  async calculateTestXp(schoolId: string, score: number, maxScore: number): Promise<{ xp: number; isPerfect: boolean }> {
    const config = await this.getConfig(schoolId);
    const rules = config.xpRules;
    
    const isPerfect = maxScore > 0 && score === maxScore;
    let xp = rules.testBaseXp + Math.round(score * rules.testPointMultiplier);
    
    if (isPerfect) {
      xp += rules.testPerfectBonus;
    }
    
    return { xp, isPerfect };
  }

  /**
   * Calculate level from total XP
   */
  async calculateLevel(schoolId: string, totalXp: number): Promise<{ level: number; xpInLevel: number; xpForNextLevel: number }> {
    const config = await this.getConfig(schoolId);
    const { baseXpPerLevel, levelMultiplier, maxLevel } = config.levelConfig;
    
    let level = 1;
    let xpNeeded = baseXpPerLevel;
    let xpAccumulated = 0;
    
    while (totalXp >= xpAccumulated + xpNeeded && level < maxLevel) {
      xpAccumulated += xpNeeded;
      level++;
      xpNeeded = Math.round(baseXpPerLevel * Math.pow(levelMultiplier, level - 1));
    }
    
    return {
      level,
      xpInLevel: totalXp - xpAccumulated,
      xpForNextLevel: xpNeeded,
    };
  }

  /**
   * Get unlocked avatar options for a user based on XP and level
   */
  async getUnlockedAvatarOptions(schoolId: string, totalXp: number, level: number) {
    const config = await this.getConfig(schoolId);
    
    const unlocked = config.avatarOptions.filter(
      opt => opt.isActive && opt.requiredXp <= totalXp && opt.requiredLevel <= level
    );
    
    const locked = config.avatarOptions.filter(
      opt => opt.isActive && (opt.requiredXp > totalXp || opt.requiredLevel > level)
    );
    
    // Group by category
    const groupByCategory = (options: AvatarOptionDefinition[]) => {
      return options.reduce((acc, opt) => {
        if (!acc[opt.category]) acc[opt.category] = [];
        acc[opt.category].push(opt);
        return acc;
      }, {} as Record<string, AvatarOptionDefinition[]>);
    };
    
    return {
      unlocked: groupByCategory(unlocked),
      locked: groupByCategory(locked),
    };
  }

  /**
   * Get all avatar options (for admin/experience_manager)
   */
  async getAllAvatarOptions(schoolId?: string) {
    const config = await this.getConfig(schoolId);
    return config.avatarOptions;
  }

  /**
   * Get medals that user has earned or can earn
   */
  async getMedalsStatus(
    schoolId: string,
    stats: {
      testsCompleted: number;
      workshopsCompleted: number;
      perfectScores: number;
      currentStreak: number;
      rankingPosition: number;
      totalXp: number;
    },
    earnedMedalIds: string[],
  ) {
    const config = await this.getConfig(schoolId);
    
    return config.medals
      .filter(m => m.isActive)
      .map(medal => {
        const earned = earnedMedalIds.includes(medal.id);
        let progress = 0;
        let target = medal.conditionValue;
        
        switch (medal.conditionType) {
          case 'tests_completed':
            progress = stats.testsCompleted;
            break;
          case 'workshops_completed':
            progress = stats.workshopsCompleted;
            break;
          case 'perfect_scores':
            progress = stats.perfectScores;
            break;
          case 'streak_days':
            progress = stats.currentStreak;
            break;
          case 'ranking_position':
            progress = stats.rankingPosition || 999;
            break;
          case 'total_xp':
            progress = stats.totalXp;
            break;
        }
        
        return {
          ...medal,
          earned,
          progress,
          target,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Check which medals should be awarded
   */
  async checkMedalsToAward(
    schoolId: string,
    stats: {
      testsCompleted: number;
      workshopsCompleted: number;
      perfectScores: number;
      currentStreak: number;
      rankingPosition: number;
      totalXp: number;
    },
    alreadyEarnedIds: string[],
  ): Promise<MedalDefinition[]> {
    const config = await this.getConfig(schoolId);
    const toAward: MedalDefinition[] = [];
    
    for (const medal of config.medals) {
      if (!medal.isActive || alreadyEarnedIds.includes(medal.id)) continue;
      
      let value = 0;
      switch (medal.conditionType) {
        case 'tests_completed': value = stats.testsCompleted; break;
        case 'workshops_completed': value = stats.workshopsCompleted; break;
        case 'perfect_scores': value = stats.perfectScores; break;
        case 'streak_days': value = stats.currentStreak; break;
        case 'ranking_position': value = stats.rankingPosition; break;
        case 'total_xp': value = stats.totalXp; break;
      }
      
      const op = medal.conditionOperator ?? 'gte';
      let conditionMet = false;
      
      switch (op) {
        case 'gte': conditionMet = value >= medal.conditionValue; break;
        case 'lte': conditionMet = value <= medal.conditionValue && value > 0; break;
        case 'eq': conditionMet = value === medal.conditionValue; break;
      }
      
      if (conditionMet) {
        toAward.push(medal);
      }
    }
    
    return toAward;
  }

  // ========== ADMIN/EXPERIENCE_MANAGER METHODS ==========

  /**
   * Update XP rules
   */
  async updateXpRules(schoolId: string, rules: Partial<XpRules>, userId: string) {
    const config = await this.getConfig(schoolId);
    Object.assign(config.xpRules, rules);
    config.lastModifiedByUserId = userId;
    await config.save();
    return config.xpRules;
  }

  /**
   * Update level config
   */
  async updateLevelConfig(schoolId: string, levelConfig: Partial<LevelConfig>, userId: string) {
    const config = await this.getConfig(schoolId);
    Object.assign(config.levelConfig, levelConfig);
    config.lastModifiedByUserId = userId;
    await config.save();
    return config.levelConfig;
  }

  /**
   * Add or update a medal
   */
  async upsertMedal(schoolId: string, medal: MedalDefinition, userId: string) {
    const config = await this.getConfig(schoolId);
    const idx = config.medals.findIndex(m => m.id === medal.id);
    
    if (idx >= 0) {
      config.medals[idx] = medal;
    } else {
      medal.sortOrder = config.medals.length;
      config.medals.push(medal);
    }
    
    config.lastModifiedByUserId = userId;
    await config.save();
    return medal;
  }

  /**
   * Delete a medal
   */
  async deleteMedal(schoolId: string, medalId: string, userId: string) {
    const config = await this.getConfig(schoolId);
    config.medals = config.medals.filter(m => m.id !== medalId);
    config.lastModifiedByUserId = userId;
    await config.save();
  }

  /**
   * Add or update an avatar option
   */
  async upsertAvatarOption(schoolId: string, option: AvatarOptionDefinition, userId: string) {
    const config = await this.getConfig(schoolId);
    const idx = config.avatarOptions.findIndex(a => a.id === option.id);
    
    if (idx >= 0) {
      config.avatarOptions[idx] = option;
    } else {
      option.sortOrder = config.avatarOptions.length;
      config.avatarOptions.push(option);
    }
    
    config.lastModifiedByUserId = userId;
    await config.save();
    return option;
  }

  /**
   * Delete an avatar option
   */
  async deleteAvatarOption(schoolId: string, optionId: string, userId: string) {
    const config = await this.getConfig(schoolId);
    config.avatarOptions = config.avatarOptions.filter(a => a.id !== optionId);
    config.lastModifiedByUserId = userId;
    await config.save();
  }

  /**
   * Get full config (for admin panel)
   */
  async getFullConfig(schoolId?: string) {
    return this.getConfig(schoolId);
  }

  /**
   * Reset to defaults
   */
  async resetToDefaults(schoolId: string, userId: string) {
    const config = await this.getConfig(schoolId);
    
    config.xpRules = {
      testBaseXp: 0,
      testPointMultiplier: 1,
      testPerfectBonus: 20,
      workshopCompletionXp: 50,
      dailyStreakXp: 5,
      weeklyStreakBonus: 50,
      monthlyStreakBonus: 200,
    };
    
    config.levelConfig = {
      baseXpPerLevel: 100,
      levelMultiplier: 1.2,
      maxLevel: 50,
    };
    
    config.medals = DEFAULT_MEDALS.map((m, i) => ({ ...m, isActive: true, sortOrder: i }));
    config.avatarOptions = DEFAULT_AVATAR_OPTIONS.map((a, i) => ({ ...a, isActive: true, sortOrder: i }));
    config.lastModifiedByUserId = userId;
    
    await config.save();
    return config;
  }
}
