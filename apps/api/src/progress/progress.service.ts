import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from '../common/roles.enum';
import { Test, TestDocument } from '../tests/schemas/test.schema';
import { TestAttempt, TestAttemptDocument } from '../tests/schemas/test-attempt.schema';
import { TestStatus } from '../tests/test.enums';
import { Workshop, WorkshopDocument } from '../workshops/schemas/workshop.schema';
import {
  StudentProgress,
  StudentProgressDocument,
  MedalType,
  MEDAL_INFO,
  Medal,
  AvatarConfig,
} from './schemas/student-progress.schema';

export interface AuthUser {
  userId: string;
  username: string;
  role: Role;
  schoolId?: string;
}

// Available avatar options that unlock with XP
export const AVATAR_OPTIONS = {
  bases: [
    { id: 'default', name: 'Básico', requiredXp: 0 },
    { id: 'cool', name: 'Cool', requiredXp: 100 },
    { id: 'nerd', name: 'Nerd', requiredXp: 200 },
    { id: 'ninja', name: 'Ninja', requiredXp: 500 },
    { id: 'robot', name: 'Robot', requiredXp: 1000 },
    { id: 'alien', name: 'Alien', requiredXp: 2000 },
  ],
  colors: [
    { id: '#6366f1', name: 'Índigo', requiredXp: 0 },
    { id: '#ec4899', name: 'Rosa', requiredXp: 0 },
    { id: '#10b981', name: 'Esmeralda', requiredXp: 50 },
    { id: '#f59e0b', name: 'Ámbar', requiredXp: 100 },
    { id: '#ef4444', name: 'Rojo', requiredXp: 150 },
    { id: '#8b5cf6', name: 'Violeta', requiredXp: 200 },
    { id: '#06b6d4', name: 'Cian', requiredXp: 300 },
    { id: '#fbbf24', name: 'Dorado', requiredXp: 500 },
  ],
  accessories: [
    { id: 'glasses', name: 'Lentes', requiredXp: 100 },
    { id: 'hat', name: 'Gorro', requiredXp: 200 },
    { id: 'headphones', name: 'Audífonos', requiredXp: 300 },
    { id: 'crown', name: 'Corona', requiredXp: 1000 },
    { id: 'halo', name: 'Aureola', requiredXp: 2000 },
  ],
  frames: [
    { id: 'none', name: 'Sin marco', requiredXp: 0 },
    { id: 'bronze', name: 'Bronce', requiredXp: 200 },
    { id: 'silver', name: 'Plata', requiredXp: 500 },
    { id: 'gold', name: 'Oro', requiredXp: 1000 },
    { id: 'diamond', name: 'Diamante', requiredXp: 2500 },
    { id: 'legendary', name: 'Legendario', requiredXp: 5000 },
  ],
};

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
  ) {}

  private requireSchoolId(user: AuthUser): string {
    return user.schoolId ?? (this.config.get<string>('DEFAULT_SCHOOL_ID') ?? 'default');
  }

  /**
   * Get or create progress record for a student
   */
  async getOrCreateProgress(user: AuthUser): Promise<StudentProgressDocument> {
    const schoolId = this.requireSchoolId(user);
    
    let progress = await this.progressModel.findOne({ userId: user.userId }).exec();
    
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
          base: 'default',
          color: '#6366f1',
          accessories: [],
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
    const rankingPosition = await this.progressModel.countDocuments({
      schoolId,
      totalXp: { $gt: progress.totalXp },
    }) + 1;

    // Get total students for ranking context
    const totalStudents = await this.progressModel.countDocuments({ schoolId });

    // Calculate level from XP (every 500 XP = 1 level)
    const level = Math.floor(progress.totalXp / 500) + 1;
    const xpForCurrentLevel = (level - 1) * 500;
    const xpForNextLevel = level * 500;
    const xpProgress = progress.totalXp - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;

    return {
      ...progress.toObject(),
      level,
      xpProgress,
      xpNeeded,
      xpPercentage: Math.round((xpProgress / xpNeeded) * 100),
      rankingPosition,
      totalStudents,
      availableWorkshops,
      completionPercentage: availableWorkshops > 0 
        ? Math.round((progress.workshopsCompletedCount / availableWorkshops) * 100)
        : 0,
      avatarOptions: this.getUnlockedAvatarOptions(progress.totalXp),
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
      .select('userId username totalXp workshopsCompletedCount testsCompletedCount medals avatar')
      .exec();

    return rankings.map((r, idx) => ({
      position: idx + 1,
      userId: r.userId,
      username: r.username,
      totalXp: r.totalXp,
      level: Math.floor(r.totalXp / 500) + 1,
      workshopsCompleted: r.workshopsCompletedCount,
      testsCompleted: r.testsCompletedCount,
      medalCount: r.medals.length,
      avatar: r.avatar,
      isMe: r.userId === user.userId,
    }));
  }

  /**
   * Get all medals with status (earned or not)
   */
  async getMedals(user: AuthUser) {
    const progress = await this.getOrCreateProgress(user);
    const earnedMedalTypes = new Set(progress.medals.map(m => m.type));

    return Object.entries(MEDAL_INFO).map(([type, info]) => ({
      type,
      ...info,
      earned: earnedMedalTypes.has(type as MedalType),
      earnedAt: progress.medals.find(m => m.type === type)?.earnedAt,
    }));
  }

  /**
   * Update avatar configuration
   */
  async updateAvatar(user: AuthUser, avatarUpdate: Partial<AvatarConfig>) {
    const progress = await this.getOrCreateProgress(user);
    const unlockedOptions = this.getUnlockedAvatarOptions(progress.totalXp);

    // Validate that user has unlocked these options
    if (avatarUpdate.base) {
      const baseOption = unlockedOptions.bases.find(b => b.id === avatarUpdate.base);
      if (!baseOption) {
        throw new Error('Avatar base not unlocked');
      }
      progress.avatar.base = avatarUpdate.base;
    }

    if (avatarUpdate.color) {
      const colorOption = unlockedOptions.colors.find(c => c.id === avatarUpdate.color);
      if (!colorOption) {
        throw new Error('Color not unlocked');
      }
      progress.avatar.color = avatarUpdate.color;
    }

    if (avatarUpdate.frame) {
      const frameOption = unlockedOptions.frames.find(f => f.id === avatarUpdate.frame);
      if (!frameOption) {
        throw new Error('Frame not unlocked');
      }
      progress.avatar.frame = avatarUpdate.frame;
    }

    if (avatarUpdate.accessories) {
      const unlockedAccessoryIds = unlockedOptions.accessories.map(a => a.id);
      for (const acc of avatarUpdate.accessories) {
        if (!unlockedAccessoryIds.includes(acc)) {
          throw new Error(`Accessory ${acc} not unlocked`);
        }
      }
      progress.avatar.accessories = avatarUpdate.accessories;
    }

    await progress.save();
    return progress.avatar;
  }

  /**
   * Record a test completion and update progress
   * Called after a student submits a test attempt
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

    // Check if test already completed
    if (progress.testsCompleted.includes(testId)) {
      // Already recorded, just update activity
      await this.updateActivity(progress);
      return progress;
    }

    // Add test to completed list
    progress.testsCompleted.push(testId);
    progress.testsCompletedCount += 1;

    // Calculate XP earned (base 25 XP + bonus for score)
    const scorePercentage = maxScore > 0 ? score / maxScore : 0;
    let xpEarned = 25; // base XP for completing
    xpEarned += Math.round(scorePercentage * 50); // up to 50 bonus XP for high scores
    
    // Perfect score medal
    if (scorePercentage === 1) {
      await this.awardMedal(progress, MedalType.PerfectScore);
    }

    progress.totalXp += xpEarned;

    // Check if all tests in workshop are completed
    const workshopTests = await this.testModel.find({
      workshopId,
      schoolId,
      status: TestStatus.Approved,
    }).select('_id').exec();

    const workshopTestIds = workshopTests.map(t => String(t._id));
    const completedTestIds = progress.testsCompleted.filter(id => workshopTestIds.includes(id));

    if (completedTestIds.length === workshopTestIds.length && workshopTestIds.length > 0) {
      // Workshop completed!
      await this.recordWorkshopCompletion(progress, workshopId, schoolId);
    }

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
    if (progress.workshopsCompleted.some(w => w.workshopId === workshopId)) {
      return;
    }

    // Calculate total score for this workshop
    const attempts = await this.attemptModel.find({
      workshopId,
      studentUserId: progress.userId,
      isSubmitted: true,
    }).exec();

    const totalScore = attempts.reduce((sum, a) => sum + a.totalScore, 0);
    const maxPossibleScore = await this.calculateMaxWorkshopScore(workshopId, schoolId);

    progress.workshopsCompleted.push({
      workshopId,
      completedAt: new Date(),
      totalScore,
      maxPossibleScore,
    });
    progress.workshopsCompletedCount += 1;

    // Award XP for workshop completion
    progress.totalXp += 100;

    // Check workshop medals
    const count = progress.workshopsCompletedCount;
    if (count === 1) await this.awardMedal(progress, MedalType.FirstWorkshop);
    if (count === 5) await this.awardMedal(progress, MedalType.Workshop5);
    if (count === 10) await this.awardMedal(progress, MedalType.Workshop10);
    if (count === 25) await this.awardMedal(progress, MedalType.Workshop25);
  }

  /**
   * Calculate max possible score for a workshop
   */
  private async calculateMaxWorkshopScore(workshopId: string, schoolId: string): Promise<number> {
    const tests = await this.testModel.find({
      workshopId,
      schoolId,
      status: TestStatus.Approved,
    }).exec();

    let maxScore = 0;
    for (const test of tests) {
      for (const q of test.questions) {
        maxScore += q.points;
      }
    }
    return maxScore;
  }

  /**
   * Award a medal if not already earned
   */
  private async awardMedal(progress: StudentProgressDocument, medalType: MedalType) {
    if (progress.medals.some(m => m.type === medalType)) {
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
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastActivity === 1) {
        // Consecutive day
        progress.currentStreak += 1;
        if (progress.currentStreak > progress.longestStreak) {
          progress.longestStreak = progress.currentStreak;
        }

        // Streak medals
        if (progress.currentStreak === 7) await this.awardMedal(progress, MedalType.Streak7);
        if (progress.currentStreak === 30) await this.awardMedal(progress, MedalType.Streak30);
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
   * Get unlocked avatar options based on XP
   */
  private getUnlockedAvatarOptions(xp: number) {
    return {
      bases: AVATAR_OPTIONS.bases.filter(b => b.requiredXp <= xp),
      colors: AVATAR_OPTIONS.colors.filter(c => c.requiredXp <= xp),
      accessories: AVATAR_OPTIONS.accessories.filter(a => a.requiredXp <= xp),
      frames: AVATAR_OPTIONS.frames.filter(f => f.requiredXp <= xp),
    };
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
