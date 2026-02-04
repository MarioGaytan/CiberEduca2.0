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
import {
  DiceBearStyle,
  DiceBearStyleDocument,
} from './schemas/dicebear-style.schema';
import {
  SchoolAvatarConfig,
  SchoolAvatarConfigDocument,
} from './schemas/school-avatar-config.schema';
import {
  SchoolMedalConfig,
  SchoolMedalConfigDocument,
} from './schemas/school-medal-config.schema';

@Injectable()
export class GamificationService {
  constructor(
    private readonly config: ConfigService,
    @InjectModel(GamificationConfig.name)
    private readonly configModel: Model<GamificationConfigDocument>,
    @InjectModel(DiceBearStyle.name)
    private readonly dicebearStyleModel: Model<DiceBearStyleDocument>,
    @InjectModel(SchoolAvatarConfig.name)
    private readonly avatarConfigModel: Model<SchoolAvatarConfigDocument>,
    @InjectModel(SchoolMedalConfig.name)
    private readonly medalConfigModel: Model<SchoolMedalConfigDocument>,
  ) {}

  private getDefaultSchoolId(): string {
    return this.config.get<string>('DEFAULT_SCHOOL_ID') ?? 'default';
  }

  /**
   * Get or create gamification config for a school
   */
  async getConfig(schoolId?: string): Promise<GamificationConfigDocument> {
    const id =
      schoolId && schoolId.trim() ? schoolId : this.getDefaultSchoolId();

    // First, fix any existing documents with empty values (migration fix)
    // This runs BEFORE loading to avoid validation errors
    await this.configModel
      .updateMany(
        { schoolId: id, 'avatarOptions.value': '' },
        { $set: { 'avatarOptions.$[elem].value': 'none' } },
        { arrayFilters: [{ 'elem.value': '' }] },
      )
      .exec();

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
        medals: DEFAULT_MEDALS.map((m, i) => ({
          ...m,
          isActive: true,
          sortOrder: i,
        })),
        avatarOptions: DEFAULT_AVATAR_OPTIONS.map((a, i) => ({
          ...a,
          isActive: true,
          sortOrder: i,
        })),
        isActive: true,
      });
    }

    return config;
  }

  /**
   * Calculate XP for a test attempt
   */
  async calculateTestXp(
    schoolId: string,
    score: number,
    maxScore: number,
  ): Promise<{ xp: number; isPerfect: boolean }> {
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
  async calculateLevel(
    schoolId: string,
    totalXp: number,
  ): Promise<{ level: number; xpInLevel: number; xpForNextLevel: number }> {
    const config = await this.getConfig(schoolId);
    const { baseXpPerLevel, levelMultiplier, maxLevel } = config.levelConfig;

    let level = 1;
    let xpNeeded = baseXpPerLevel;
    let xpAccumulated = 0;

    while (totalXp >= xpAccumulated + xpNeeded && level < maxLevel) {
      xpAccumulated += xpNeeded;
      level++;
      xpNeeded = Math.round(
        baseXpPerLevel * Math.pow(levelMultiplier, level - 1),
      );
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
  async getUnlockedAvatarOptions(
    schoolId: string,
    totalXp: number,
    level: number,
  ) {
    const config = await this.getConfig(schoolId);

    const unlocked = config.avatarOptions.filter(
      (opt) =>
        opt.isActive && opt.requiredXp <= totalXp && opt.requiredLevel <= level,
    );

    const locked = config.avatarOptions.filter(
      (opt) =>
        opt.isActive && (opt.requiredXp > totalXp || opt.requiredLevel > level),
    );

    // Group by category
    const groupByCategory = (options: AvatarOptionDefinition[]) => {
      return options.reduce(
        (acc, opt) => {
          if (!acc[opt.category]) acc[opt.category] = [];
          acc[opt.category].push(opt);
          return acc;
        },
        {} as Record<string, AvatarOptionDefinition[]>,
      );
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

    // Convert to plain objects to ensure spread works correctly
    const configObj =
      typeof (config as any).toObject === 'function'
        ? (config as any).toObject()
        : config;
    const medalsArray = configObj.medals || [];

    return medalsArray
      .filter((m: MedalDefinition) => m.isActive)
      .map((medal: MedalDefinition) => {
        const earned = earnedMedalIds.includes(medal.id);
        let progress = 0;
        const target = medal.conditionValue;

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
      .sort((a: any, b: any) => a.sortOrder - b.sortOrder);
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

    // Convert to plain objects to ensure proper access
    const configObj =
      typeof (config as any).toObject === 'function'
        ? (config as any).toObject()
        : config;
    const medalsArray = configObj.medals || [];

    console.log('[MEDALS DEBUG] Stats:', stats);
    console.log('[MEDALS DEBUG] Already earned IDs:', alreadyEarnedIds);
    console.log('[MEDALS DEBUG] Total medals in config:', medalsArray.length);

    for (const medal of medalsArray) {
      const alreadyEarned = alreadyEarnedIds.includes(medal.id);
      if (!medal.isActive || alreadyEarned) {
        if (alreadyEarned) {
          console.log(`[MEDALS DEBUG] Skipping ${medal.id} - already earned`);
        }
        continue;
      }

      let value = 0;
      switch (medal.conditionType) {
        case 'tests_completed':
          value = stats.testsCompleted;
          break;
        case 'workshops_completed':
          value = stats.workshopsCompleted;
          break;
        case 'perfect_scores':
          value = stats.perfectScores;
          break;
        case 'streak_days':
          value = stats.currentStreak;
          break;
        case 'ranking_position':
          value = stats.rankingPosition;
          break;
        case 'total_xp':
          value = stats.totalXp;
          break;
        case 'level_reached':
          value = Math.floor(stats.totalXp / 500) + 1;
          break;
      }

      const op = medal.conditionOperator ?? 'gte';
      let conditionMet = false;

      switch (op) {
        case 'gte':
          conditionMet = value >= medal.conditionValue;
          break;
        case 'lte':
          conditionMet = value <= medal.conditionValue && value > 0;
          break;
        case 'eq':
          conditionMet = value === medal.conditionValue;
          break;
      }

      console.log(
        `[MEDALS DEBUG] Medal ${medal.id} (${medal.name}): condition=${medal.conditionType}, value=${value}, target=${medal.conditionValue}, op=${op}, met=${conditionMet}`,
      );

      if (conditionMet) {
        toAward.push(medal);
      }
    }

    console.log(
      '[MEDALS DEBUG] Medals to award:',
      toAward.map((m) => m.id),
    );
    return toAward;
  }

  // ========== ADMIN/EXPERIENCE_MANAGER METHODS ==========

  /**
   * Update XP rules
   */
  async updateXpRules(
    schoolId: string,
    rules: Partial<XpRules>,
    userId: string,
  ) {
    const config = await this.getConfig(schoolId);
    Object.assign(config.xpRules, rules);
    config.lastModifiedByUserId = userId;
    await config.save();
    return config.xpRules;
  }

  /**
   * Update level config
   */
  async updateLevelConfig(
    schoolId: string,
    levelConfig: Partial<LevelConfig>,
    userId: string,
  ) {
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
    const idx = config.medals.findIndex((m) => m.id === medal.id);

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
    config.medals = config.medals.filter((m) => m.id !== medalId);
    config.lastModifiedByUserId = userId;
    await config.save();
  }

  /**
   * Reorder medals
   */
  async reorderMedals(schoolId: string, medalIds: string[], userId: string) {
    const config = await this.getConfig(schoolId);

    // Create a map of id -> new sortOrder
    const orderMap = new Map(medalIds.map((id, idx) => [id, idx]));

    // Update sort orders
    config.medals.forEach((medal) => {
      const newOrder = orderMap.get(medal.id);
      if (newOrder !== undefined) {
        medal.sortOrder = newOrder;
      }
    });

    // Sort medals by new order
    config.medals.sort((a, b) => a.sortOrder - b.sortOrder);

    config.lastModifiedByUserId = userId;
    await config.save();
  }

  /**
   * Add or update an avatar option
   */
  async upsertAvatarOption(
    schoolId: string,
    option: AvatarOptionDefinition,
    userId: string,
  ) {
    const config = await this.getConfig(schoolId);
    const idx = config.avatarOptions.findIndex((a) => a.id === option.id);

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
    config.avatarOptions = config.avatarOptions.filter(
      (a) => a.id !== optionId,
    );
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

    config.medals = DEFAULT_MEDALS.map((m, i) => ({
      ...m,
      isActive: true,
      sortOrder: i,
    }));
    config.avatarOptions = DEFAULT_AVATAR_OPTIONS.map((a, i) => ({
      ...a,
      isActive: true,
      sortOrder: i,
    }));
    config.lastModifiedByUserId = userId;

    await config.save();
    return config;
  }

  // ========== DICEBEAR STYLES METHODS ==========

  /**
   * Get all DiceBear styles with computed counts
   */
  async getDiceBearStyles(activeOnly = true) {
    const query = activeOnly ? { isActive: true } : {};
    const styles = await this.dicebearStyleModel
      .find(query)
      .sort({ sortOrder: 1 })
      .exec();

    // Add computed counts for frontend
    return styles.map((style) => {
      const doc = style.toObject();
      return {
        ...doc,
        categoriesCount: doc.categories?.length ?? 0,
        optionsCount:
          doc.categories?.reduce(
            (sum: number, c: any) => sum + (c.options?.length ?? 0),
            0,
          ) ?? 0,
      };
    });
  }

  /**
   * Get a single DiceBear style by ID
   */
  async getDiceBearStyle(styleId: string) {
    const style = await this.dicebearStyleModel.findOne({ styleId }).exec();
    if (!style) {
      throw new NotFoundException(`Style ${styleId} not found`);
    }
    return style;
  }

  /**
   * Update DiceBear style settings (enable/disable, sort order)
   */
  async updateDiceBearStyle(
    styleId: string,
    updates: { isActive?: boolean; sortOrder?: number },
  ) {
    const style = await this.dicebearStyleModel
      .findOneAndUpdate({ styleId }, { $set: updates }, { new: true })
      .exec();

    if (!style) {
      throw new NotFoundException(`Style ${styleId} not found`);
    }
    return style;
  }

  /**
   * Get avatar configuration for a specific style with unlock requirements
   * This combines the DiceBear style data with school-specific unlock settings
   */
  async getStyleOptionsForUser(
    schoolId: string,
    styleId: string,
    userXp: number,
    userLevel: number,
  ) {
    const style = await this.getDiceBearStyle(styleId);
    const config = await this.getConfig(schoolId);
    const avatarConfigs = await this.getAvatarConfigsForStyle(
      schoolId,
      styleId,
    );
    const avatarConfigMap = new Map(
      avatarConfigs.map((c) => [`${c.category}:${c.optionValue}`, c] as const),
    );

    // Get unlock requirements for this style
    const styleOptionFromNew = avatarConfigMap.get(`style:${styleId}`);
    const styleOptionFromLegacy = config.avatarOptions.find(
      (opt) => opt.category === 'style' && opt.value === styleId,
    );
    const styleOption = styleOptionFromNew
      ? {
          requiredXp: styleOptionFromNew.requiredXp,
          requiredLevel: styleOptionFromNew.requiredLevel,
        }
      : styleOptionFromLegacy;

    const isStyleUnlocked =
      !styleOption ||
      (styleOption.requiredXp <= userXp &&
        styleOption.requiredLevel <= userLevel);

    // Build categories with unlock status
    // Convert Mongoose subdocuments to plain objects to preserve all fields
    const styleObj = style.toObject();
    const categoriesWithStatus = styleObj.categories.map((category: any) => {
      const optionsWithStatus = (category.options || []).map((option: any) => {
        // Find if there's a specific unlock requirement for this option
        const optionConfigFromNew = avatarConfigMap.get(
          `${category.name}:${option.value}`,
        );
        const optionConfigFromLegacy = config.avatarOptions.find(
          (opt) => opt.category === category.name && opt.value === option.value,
        );
        const optionConfig = optionConfigFromNew
          ? {
              requiredXp: optionConfigFromNew.requiredXp,
              requiredLevel: optionConfigFromNew.requiredLevel,
            }
          : optionConfigFromLegacy;

        const requiredXp = optionConfig?.requiredXp ?? 0;
        const requiredLevel = optionConfig?.requiredLevel ?? 0;
        const isUnlocked = requiredXp <= userXp && requiredLevel <= userLevel;

        return {
          ...option,
          requiredXp,
          requiredLevel,
          isUnlocked,
        };
      });

      return {
        ...category,
        options: optionsWithStatus,
      };
    });

    return {
      ...styleObj,
      isUnlocked: isStyleUnlocked,
      requiredXp: styleOption?.requiredXp ?? 0,
      requiredLevel: styleOption?.requiredLevel ?? 0,
      categories: categoriesWithStatus,
    };
  }

  /**
   * Get all styles with their unlock status for a user
   */
  async getAllStylesForUser(
    schoolId: string,
    userXp: number,
    userLevel: number,
  ) {
    const styles = await this.getDiceBearStyles(true);
    const config = await this.getConfig(schoolId);
    const id = schoolId?.trim() || this.getDefaultSchoolId();
    const styleUnlockConfigs = await this.avatarConfigModel
      .find({ schoolId: id, category: 'style' })
      .lean()
      .exec();
    const styleUnlockMap = new Map(
      styleUnlockConfigs.map((c) => [c.optionValue, c] as const),
    );

    return styles.map((style) => {
      const styleOptionFromNew = styleUnlockMap.get(style.styleId);
      const styleOptionFromLegacy = config.avatarOptions.find(
        (opt) => opt.category === 'style' && opt.value === style.styleId,
      );
      const styleOption = styleOptionFromNew
        ? {
            requiredXp: styleOptionFromNew.requiredXp,
            requiredLevel: styleOptionFromNew.requiredLevel,
          }
        : styleOptionFromLegacy;

      const requiredXp = styleOption?.requiredXp ?? 0;
      const requiredLevel = styleOption?.requiredLevel ?? 0;
      const isUnlocked = requiredXp <= userXp && requiredLevel <= userLevel;

      return {
        styleId: style.styleId,
        displayName: style.displayName,
        creator: style.creator,
        apiUrl: style.apiUrl,
        categoriesCount: style.categories.length,
        optionsCount: style.categories.reduce(
          (sum, c) => sum + c.options.length,
          0,
        ),
        requiredXp,
        requiredLevel,
        isUnlocked,
      };
    });
  }

  // ========== OPTIMIZED AVATAR CONFIG METHODS (New Collections) ==========

  /**
   * Get avatar configs for a specific style with optimized query
   * Uses compound index: schoolId + styleId + category
   */
  async getAvatarConfigsForStyle(schoolId: string, styleId: string) {
    const id = schoolId?.trim() || this.getDefaultSchoolId();

    return this.avatarConfigModel
      .find({ schoolId: id, styleId })
      .sort({ category: 1, sortOrder: 1 })
      .lean()
      .exec();
  }

  /**
   * Get unlocked avatar configs using optimized index query
   * Uses compound index: schoolId + styleId + requiredXp + requiredLevel
   */
  async getUnlockedAvatarConfigsForStyle(
    schoolId: string,
    styleId: string,
    userXp: number,
    userLevel: number,
  ) {
    const id = schoolId?.trim() || this.getDefaultSchoolId();

    return this.avatarConfigModel
      .find({
        schoolId: id,
        styleId,
        isActive: true,
        requiredXp: { $lte: userXp },
        requiredLevel: { $lte: userLevel },
      })
      .sort({ category: 1, sortOrder: 1 })
      .lean()
      .exec();
  }

  /**
   * Upsert an avatar config (optimized single document update)
   */
  async upsertAvatarConfig(
    schoolId: string,
    styleId: string,
    category: string,
    optionValue: string,
    data: Partial<SchoolAvatarConfig>,
    userId?: string,
  ) {
    const id = schoolId?.trim() || this.getDefaultSchoolId();

    return this.avatarConfigModel
      .findOneAndUpdate(
        { schoolId: id, styleId, category, optionValue },
        {
          $set: {
            ...data,
            schoolId: id,
            styleId,
            category,
            optionValue,
            lastModifiedBy: userId,
          },
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  /**
   * Bulk upsert avatar configs for a style (efficient batch operation)
   */
  async bulkUpsertAvatarConfigs(
    schoolId: string,
    styleId: string,
    configs: Array<{
      category: string;
      optionValue: string;
      displayName: string;
      requiredXp: number;
      requiredLevel: number;
      isActive?: boolean;
      sortOrder?: number;
    }>,
    userId?: string,
  ) {
    const id = schoolId?.trim() || this.getDefaultSchoolId();

    const bulkOps = configs.map((config, idx) => ({
      updateOne: {
        filter: {
          schoolId: id,
          styleId,
          category: config.category,
          optionValue: config.optionValue,
        },
        update: {
          $set: {
            schoolId: id,
            styleId,
            category: config.category,
            optionValue: config.optionValue,
            displayName: config.displayName,
            requiredXp: config.requiredXp,
            requiredLevel: config.requiredLevel,
            isActive: config.isActive ?? true,
            sortOrder: config.sortOrder ?? idx,
            lastModifiedBy: userId,
          },
        },
        upsert: true,
      },
    }));

    return this.avatarConfigModel.bulkWrite(bulkOps);
  }

  /**
   * Get style unlock config (whether a whole style is unlocked)
   */
  async getStyleUnlockConfig(schoolId: string, styleId: string) {
    const id = schoolId?.trim() || this.getDefaultSchoolId();

    return this.avatarConfigModel
      .findOne({
        schoolId: id,
        styleId,
        category: 'style',
        optionValue: styleId,
      })
      .lean()
      .exec();
  }

  /**
   * Update style unlock requirements
   */
  async updateStyleUnlockConfig(
    schoolId: string,
    styleId: string,
    requiredXp: number,
    requiredLevel: number,
    userId?: string,
  ) {
    const id = schoolId?.trim() || this.getDefaultSchoolId();
    const style = await this.getDiceBearStyle(styleId);

    return this.avatarConfigModel
      .findOneAndUpdate(
        { schoolId: id, styleId, category: 'style', optionValue: styleId },
        {
          $set: {
            schoolId: id,
            styleId,
            category: 'style',
            optionValue: styleId,
            displayName: style.displayName,
            requiredXp,
            requiredLevel,
            isActive: true,
            lastModifiedBy: userId,
          },
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  // ========== OPTIMIZED MEDAL CONFIG METHODS (New Collections) ==========

  /**
   * Get all medals for a school using optimized query
   */
  async getMedalsForSchool(schoolId: string, activeOnly = true) {
    const id = schoolId?.trim() || this.getDefaultSchoolId();
    const query: any = { schoolId: id };
    if (activeOnly) query.isActive = true;

    return this.medalConfigModel
      .find(query)
      .sort({ sortOrder: 1 })
      .lean()
      .exec();
  }

  /**
   * Get medals that should be awarded based on user stats
   * Uses index: schoolId + conditionType + conditionValue
   */
  async getMedalsToAward(
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
  ) {
    const id = schoolId?.trim() || this.getDefaultSchoolId();

    const allMedals = await this.medalConfigModel
      .find({ schoolId: id, isActive: true })
      .lean()
      .exec();

    const toAward: SchoolMedalConfigDocument[] = [];

    for (const medal of allMedals) {
      if (alreadyEarnedIds.includes(medal.medalId)) continue;

      let value = 0;
      switch (medal.conditionType) {
        case 'tests_completed':
          value = stats.testsCompleted;
          break;
        case 'workshops_completed':
          value = stats.workshopsCompleted;
          break;
        case 'perfect_scores':
          value = stats.perfectScores;
          break;
        case 'streak_days':
          value = stats.currentStreak;
          break;
        case 'ranking_position':
          value = stats.rankingPosition;
          break;
        case 'total_xp':
          value = stats.totalXp;
          break;
      }

      const op = medal.conditionOperator ?? 'gte';
      let conditionMet = false;

      switch (op) {
        case 'gte':
          conditionMet = value >= medal.conditionValue;
          break;
        case 'lte':
          conditionMet = value <= medal.conditionValue && value > 0;
          break;
        case 'eq':
          conditionMet = value === medal.conditionValue;
          break;
      }

      if (conditionMet) {
        toAward.push(medal as any);
      }
    }

    return toAward;
  }

  /**
   * Upsert a medal config
   */
  async upsertMedalConfig(
    schoolId: string,
    medalId: string,
    data: Partial<SchoolMedalConfig>,
    userId?: string,
  ) {
    const id = schoolId?.trim() || this.getDefaultSchoolId();

    return this.medalConfigModel
      .findOneAndUpdate(
        { schoolId: id, medalId },
        {
          $set: {
            ...data,
            schoolId: id,
            medalId,
            lastModifiedBy: userId,
          },
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  /**
   * Delete a medal config
   */
  async deleteMedalConfig(schoolId: string, medalId: string) {
    const id = schoolId?.trim() || this.getDefaultSchoolId();
    return this.medalConfigModel.deleteOne({ schoolId: id, medalId }).exec();
  }

  /**
   * Seed default medals for a school (migration helper)
   */
  async seedDefaultMedals(schoolId: string, userId?: string) {
    const id = schoolId?.trim() || this.getDefaultSchoolId();

    const bulkOps = DEFAULT_MEDALS.map((medal, idx) => ({
      updateOne: {
        filter: { schoolId: id, medalId: medal.id },
        update: {
          $setOnInsert: {
            schoolId: id,
            medalId: medal.id,
            name: medal.name,
            description: medal.description,
            icon: medal.icon,
            iconType: 'emoji',
            xpReward: medal.xpReward,
            conditionType: medal.conditionType,
            conditionValue: medal.conditionValue,
            conditionOperator: (medal as any).conditionOperator ?? 'gte',
            isActive: true,
            sortOrder: idx,
            lastModifiedBy: userId,
          },
        },
        upsert: true,
      },
    }));

    return this.medalConfigModel.bulkWrite(bulkOps);
  }
}
