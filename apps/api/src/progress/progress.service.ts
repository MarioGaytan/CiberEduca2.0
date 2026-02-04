import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from '../common/roles.enum';
import { Test, TestDocument } from '../tests/schemas/test.schema';
import {
  TestAttempt,
  TestAttemptDocument,
} from '../tests/schemas/test-attempt.schema';
import { TestStatus } from '../tests/test.enums';
import {
  Workshop,
  WorkshopDocument,
} from '../workshops/schemas/workshop.schema';
import {
  StudentProgress,
  StudentProgressDocument,
  MedalType,
  MEDAL_INFO,
  Medal,
  AvatarConfig,
  TestCompletion,
} from './schemas/student-progress.schema';
import { GamificationService } from '../gamification/gamification.service';

export interface AuthUser {
  userId: string;
  username: string;
  role: Role;
  schoolId?: string;
}

// Legacy avatar options removed - now using dynamic DiceBear configuration
// Avatar options are fetched from GamificationService.getUnlockedAvatarOptions()

@Injectable()
export class ProgressService {
  constructor(
    private readonly config: ConfigService,
    @InjectModel(StudentProgress.name)
    private readonly progressModel: Model<StudentProgressDocument>,
    @InjectModel(Test.name)
    private readonly testModel: Model<TestDocument>,
    @InjectModel(TestAttempt.name)
    private readonly attemptModel: Model<TestAttemptDocument>,
    @InjectModel(Workshop.name)
    private readonly workshopModel: Model<WorkshopDocument>,
    @Inject(forwardRef(() => GamificationService))
    private readonly gamificationService: GamificationService,
  ) {}

  private requireSchoolId(user: AuthUser): string {
    return (
      user.schoolId ?? this.config.get<string>('DEFAULT_SCHOOL_ID') ?? 'default'
    );
  }

  /**
   * Calculate level and XP progress from total XP using gamification config
   */
  private calculateLevelFromXp(
    totalXp: number,
    levelConfig: {
      baseXpPerLevel: number;
      levelMultiplier: number;
      maxLevel: number;
    },
  ): {
    level: number;
    xpProgress: number;
    xpNeeded: number;
    xpPercentage: number;
  } {
    const { baseXpPerLevel, levelMultiplier, maxLevel } = levelConfig;

    let level = 1;
    let accumulatedXp = 0;

    // Find current level by accumulating XP requirements
    while (level < maxLevel) {
      const xpForThisLevel = Math.round(
        baseXpPerLevel * Math.pow(levelMultiplier, level - 1),
      );
      if (accumulatedXp + xpForThisLevel > totalXp) {
        break;
      }
      accumulatedXp += xpForThisLevel;
      level++;
    }

    // Calculate progress within current level
    const xpProgress = totalXp - accumulatedXp;
    const xpNeeded =
      level < maxLevel
        ? Math.round(baseXpPerLevel * Math.pow(levelMultiplier, level - 1))
        : 0;
    const xpPercentage =
      xpNeeded > 0 ? Math.round((xpProgress / xpNeeded) * 100) : 100;

    return { level, xpProgress, xpNeeded, xpPercentage };
  }

  /**
   * Get or create progress record for a student
   */
  async getOrCreateProgress(user: AuthUser): Promise<StudentProgressDocument> {
    const schoolId = this.requireSchoolId(user);

    let progress = await this.progressModel
      .findOne({ userId: user.userId })
      .exec();

    if (!progress) {
      progress = new this.progressModel({
        userId: user.userId,
        schoolId,
        username: user.username,
        totalXp: 0,
        workshopsCompletedCount: 0,
        testsCompletedCount: 0,
        workshopsCompleted: [],
        testsCompleted: [],
        medals: [],
        avatar: {
          style: 'avataaars',
          base: 'default',
          color: '#6366f1',
          accessories: '',
          frame: 'none',
        },
        currentStreak: 0,
        longestStreak: 0,
      });
      await progress.save();
    }

    return progress;
  }

  /**
   * Get my progress with computed stats
   */
  async getMyProgress(user: AuthUser) {
    if (user.role !== Role.Student) {
      return null;
    }

    const progress = await this.getOrCreateProgress(user);
    const schoolId = this.requireSchoolId(user);

    // Get available workshops count
    const availableWorkshops = await this.workshopModel.countDocuments({
      schoolId,
      status: 'approved',
    });

    // Get ranking position
    const rankingPosition =
      (await this.progressModel.countDocuments({
        schoolId,
        totalXp: { $gt: progress.totalXp },
      })) + 1;

    // Get total students for ranking context
    const totalStudents = await this.progressModel.countDocuments({ schoolId });

    // Get level config from gamification settings
    const gamificationConfig =
      await this.gamificationService.getConfig(schoolId);
    const levelConfig = gamificationConfig.levelConfig || {
      baseXpPerLevel: 100,
      levelMultiplier: 1.2,
      maxLevel: 50,
    };

    // Calculate level from XP using dynamic config
    const { level, xpProgress, xpNeeded, xpPercentage } =
      this.calculateLevelFromXp(progress.totalXp, levelConfig);

    return {
      ...progress.toObject(),
      level,
      xpProgress,
      xpNeeded,
      xpPercentage,
      rankingPosition,
      totalStudents,
      availableWorkshops,
      completionPercentage:
        availableWorkshops > 0
          ? Math.round(
              (progress.workshopsCompletedCount / availableWorkshops) * 100,
            )
          : 0,
      // avatarOptions now fetched via /api/gamification/avatar-options/:xp/:level
    };
  }

  /**
   * Get ranking of students
   */
  async getRanking(user: AuthUser, limit = 50) {
    const schoolId = this.requireSchoolId(user);

    const rankings = await this.progressModel
      .find({ schoolId })
      .sort({ totalXp: -1 })
      .limit(limit)
      .select(
        'userId username totalXp workshopsCompletedCount testsCompletedCount medals avatar',
      )
      .exec();

    // Get level config for calculating levels
    const gamificationConfig =
      await this.gamificationService.getConfig(schoolId);
    const levelConfig = gamificationConfig.levelConfig || {
      baseXpPerLevel: 100,
      levelMultiplier: 1.2,
      maxLevel: 50,
    };

    return rankings.map((r, idx) => {
      const { level } = this.calculateLevelFromXp(r.totalXp, levelConfig);
      return {
        position: idx + 1,
        userId: r.userId,
        username: r.username,
        totalXp: r.totalXp,
        level,
        workshopsCompleted: r.workshopsCompletedCount,
        testsCompleted: r.testsCompletedCount,
        medalCount: r.medals.length,
        avatar: r.avatar,
        isMe: r.userId === user.userId,
      };
    });
  }

  /**
   * Get all medals with status (earned or not)
   * Uses dynamic medals from GamificationConfig instead of hardcoded MEDAL_INFO
   */
  async getMedals(user: AuthUser) {
    const progress = await this.getOrCreateProgress(user);
    const schoolId = this.requireSchoolId(user);

    // Get earned medal IDs from progress
    const earnedMedalIds = progress.medals.map((m) => m.type);

    // Calculate stats for progress tracking
    const stats = {
      testsCompleted: progress.testsCompletedCount,
      workshopsCompleted: progress.workshopsCompletedCount,
      perfectScores: progress.testsCompleted.filter(
        (t) => t.bestScore === t.maxScore && t.maxScore > 0,
      ).length,
      currentStreak: progress.currentStreak,
      rankingPosition:
        (await this.progressModel.countDocuments({
          schoolId,
          totalXp: { $gt: progress.totalXp },
        })) + 1,
      totalXp: progress.totalXp,
    };

    // Get medals from dynamic config with earned status
    const medals = await this.gamificationService.getMedalsStatus(
      schoolId,
      stats,
      earnedMedalIds,
    );

    // Add earnedAt date for earned medals
    return medals.map((medal: any) => ({
      type: medal.id,
      name: medal.name,
      description: medal.description,
      icon: medal.icon,
      iconType: medal.iconType || 'emoji',
      iconColor: medal.iconColor,
      bgColor: medal.bgColor,
      borderColor: medal.borderColor,
      shape: medal.shape,
      glow: medal.glow,
      xp: medal.xpReward,
      earned: medal.earned,
      earnedAt: progress.medals.find((m) => m.type === medal.id)?.earnedAt,
      conditionType: medal.conditionType,
      conditionValue: medal.conditionValue,
      progress: medal.progress,
      target: medal.target,
    }));
  }

  /**
   * Update avatar configuration (DiceBear format)
   * Replaces the entire avatar object to ensure all dynamic fields are saved.
   * Each DiceBear style has different properties, so we store them as a flexible object.
   */
  async updateAvatar(user: AuthUser, avatarUpdate: Partial<AvatarConfig>) {
    const progress = await this.getOrCreateProgress(user);

    const shouldUnset = (v: unknown) =>
      v === undefined || v === null || v === '' || v === 'none';

    // Build new avatar object from scratch to avoid stale fields from previous styles
    const newAvatar: Record<string, string> = {};

    // Always ensure style is set
    const newStyle =
      avatarUpdate.style || progress.avatar?.style || 'avataaars';
    newAvatar.style = newStyle;

    // If style changed, only keep the new style (reset all other fields)
    // If style is the same, merge current avatar with updates
    const isStyleChange =
      avatarUpdate.style !== undefined &&
      avatarUpdate.style !== progress.avatar?.style;

    if (!isStyleChange && progress.avatar) {
      // Keep existing values from current avatar (same style)
      for (const [key, value] of Object.entries(
        progress.avatar as Record<string, unknown>,
      )) {
        if (key === 'style' || key === '_id') continue;
        if (!shouldUnset(value)) {
          newAvatar[key] = String(value);
        }
      }
    }

    // Apply all updates from the request
    for (const [key, value] of Object.entries(
      avatarUpdate as Record<string, unknown>,
    )) {
      if (key === 'seed' || key === '_id') continue;
      if (key === 'style') continue; // Already handled above

      if (shouldUnset(value)) {
        // Remove the field if it should be unset
        delete newAvatar[key];
      } else {
        newAvatar[key] = String(value);
      }
    }

    // Replace the entire avatar object (this ensures Mongoose saves all fields)
    progress.set('avatar', newAvatar);
    progress.markModified('avatar');

    await progress.save();
    return progress.avatar;
  }

  /**
   * Record a test completion and update progress
   * Called after a student submits a test attempt
   *
   * XP Logic: Only the best score counts. If student retakes and gets better score,
   * they get the DIFFERENCE in XP, not cumulative.
   */
  async recordTestCompletion(
    user: AuthUser,
    testId: string,
    workshopId: string,
    score: number,
    maxScore: number,
  ) {
    if (user.role !== Role.Student) return null;

    const progress = await this.getOrCreateProgress(user);
    const schoolId = this.requireSchoolId(user);
    const now = new Date();

    // Calculate XP for this score (simple: XP = score)
    // TODO: Use GamificationService for dynamic config
    const xpForThisScore = score;
    const isPerfect = maxScore > 0 && score === maxScore;

    // Find existing test completion
    const existingIdx = progress.testsCompleted.findIndex(
      (tc) => tc.testId === testId,
    );

    if (existingIdx >= 0) {
      // Test was completed before - check if new score is better
      const existing = progress.testsCompleted[existingIdx];
      existing.attemptCount += 1;
      existing.lastAttemptAt = now;

      if (score > existing.bestScore) {
        // New best score! Calculate XP difference
        const xpDifference = xpForThisScore - existing.xpEarned;

        if (xpDifference > 0) {
          progress.totalXp += xpDifference;
          existing.bestScore = score;
          existing.xpEarned = xpForThisScore;
        }
      }
      // If score is same or worse, no XP change
    } else {
      // First time completing this test
      const testCompletion: TestCompletion = {
        testId,
        workshopId,
        bestScore: score,
        maxScore,
        xpEarned: xpForThisScore,
        firstCompletedAt: now,
        lastAttemptAt: now,
        attemptCount: 1,
      };

      progress.testsCompleted.push(testCompletion);
      progress.testsCompletedCount += 1;
      progress.totalXp += xpForThisScore;
    }

    // Check if all tests in workshop are completed
    const workshopTests = await this.testModel
      .find({
        workshopId,
        schoolId,
        status: TestStatus.Approved,
      })
      .select('_id')
      .exec();

    const workshopTestIds = workshopTests.map((t) => String(t._id));
    const completedTestIds = progress.testsCompleted
      .filter((tc) => workshopTestIds.includes(tc.testId))
      .map((tc) => tc.testId);

    if (
      completedTestIds.length === workshopTestIds.length &&
      workshopTestIds.length > 0
    ) {
      // Workshop completed!
      await this.recordWorkshopCompletion(progress, workshopId, schoolId);
    }

    // Check and award dynamic medals AFTER workshop completion is recorded
    // This ensures workshopsCompletedCount is up-to-date
    await this.checkAndAwardDynamicMedals(progress, schoolId, isPerfect);

    await this.updateActivity(progress);
    await progress.save();

    return progress;
  }

  /**
   * Record workshop completion
   */
  private async recordWorkshopCompletion(
    progress: StudentProgressDocument,
    workshopId: string,
    schoolId: string,
  ) {
    // Check if already completed
    if (progress.workshopsCompleted.some((w) => w.workshopId === workshopId)) {
      return;
    }

    // Calculate total score for this workshop
    const attempts = await this.attemptModel
      .find({
        workshopId,
        studentUserId: progress.userId,
        isSubmitted: true,
      })
      .exec();

    const totalScore = attempts.reduce((sum, a) => sum + a.totalScore, 0);
    const maxPossibleScore = await this.calculateMaxWorkshopScore(
      workshopId,
      schoolId,
    );

    progress.workshopsCompleted.push({
      workshopId,
      completedAt: new Date(),
      totalScore,
      maxPossibleScore,
    });
    progress.workshopsCompletedCount += 1;

    // Award XP for workshop completion
    progress.totalXp += 100;

    // Dynamic medals are checked in recordTestCompletion after workshop completion
  }

  /**
   * Calculate max possible score for a workshop
   */
  private async calculateMaxWorkshopScore(
    workshopId: string,
    schoolId: string,
  ): Promise<number> {
    const tests = await this.testModel
      .find({
        workshopId,
        schoolId,
        status: TestStatus.Approved,
      })
      .exec();

    let maxScore = 0;
    for (const test of tests) {
      for (const q of test.questions) {
        maxScore += q.points;
      }
    }
    return maxScore;
  }

  /**
   * Check and award dynamic medals based on current stats
   */
  private async checkAndAwardDynamicMedals(
    progress: StudentProgressDocument,
    schoolId: string,
    justGotPerfectScore = false,
  ) {
    // Calculate current stats
    const perfectScores = progress.testsCompleted.filter(
      (t) => t.bestScore === t.maxScore && t.maxScore > 0,
    ).length;

    const rankingPosition =
      (await this.progressModel.countDocuments({
        schoolId,
        totalXp: { $gt: progress.totalXp },
      })) + 1;

    const stats = {
      testsCompleted: progress.testsCompletedCount,
      workshopsCompleted: progress.workshopsCompletedCount,
      perfectScores: justGotPerfectScore ? perfectScores : perfectScores,
      currentStreak: progress.currentStreak,
      rankingPosition,
      totalXp: progress.totalXp,
    };

    // Get already earned medal IDs
    const earnedMedalIds = progress.medals.map((m) => m.type);

    // Check which medals should be awarded
    const medalsToAward = await this.gamificationService.checkMedalsToAward(
      schoolId,
      stats,
      earnedMedalIds,
    );

    // Award each medal
    for (const medal of medalsToAward) {
      progress.medals.push({
        type: medal.id,
        earnedAt: new Date(),
      });
      progress.totalXp += medal.xpReward;
    }
  }

  /**
   * Award a medal if not already earned (legacy - kept for compatibility)
   */
  private async awardMedal(
    progress: StudentProgressDocument,
    medalType: MedalType,
  ) {
    if (progress.medals.some((m) => m.type === medalType)) {
      return; // Already has this medal
    }

    const medalInfo = MEDAL_INFO[medalType];
    progress.medals.push({
      type: medalType,
      earnedAt: new Date(),
    });
    progress.totalXp += medalInfo.xp;
  }

  /**
   * Update activity timestamp and streak
   */
  private async updateActivity(progress: StudentProgressDocument) {
    const now = new Date();
    const lastActivity = progress.lastActivityAt;

    if (lastActivity) {
      const daysSinceLastActivity = Math.floor(
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceLastActivity === 1) {
        // Consecutive day
        progress.currentStreak += 1;
        if (progress.currentStreak > progress.longestStreak) {
          progress.longestStreak = progress.currentStreak;
        }

        // Streak medals
        if (progress.currentStreak === 7)
          await this.awardMedal(progress, MedalType.Streak7);
        if (progress.currentStreak === 30)
          await this.awardMedal(progress, MedalType.Streak30);
      } else if (daysSinceLastActivity > 1) {
        // Streak broken
        progress.currentStreak = 1;
      }
      // Same day - don't change streak
    } else {
      progress.currentStreak = 1;
    }

    progress.lastActivityAt = now;
  }

  /**
   * Update ranking medals (called periodically or on demand)
   */
  async updateRankingMedals(schoolId: string) {
    const topStudents = await this.progressModel
      .find({ schoolId })
      .sort({ totalXp: -1 })
      .limit(10)
      .exec();

    for (let i = 0; i < topStudents.length; i++) {
      const student = topStudents[i];
      if (i === 0) await this.awardMedal(student, MedalType.FirstPlace);
      if (i < 3) await this.awardMedal(student, MedalType.Top3);
      if (i < 10) await this.awardMedal(student, MedalType.Top10);
      await student.save();
    }
  }
}
