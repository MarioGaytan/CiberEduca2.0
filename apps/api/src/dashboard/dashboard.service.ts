import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from '../common/roles.enum';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Workshop,
  WorkshopDocument,
} from '../workshops/schemas/workshop.schema';
import { Test, TestDocument } from '../tests/schemas/test.schema';
import {
  TestAttempt,
  TestAttemptDocument,
} from '../tests/schemas/test-attempt.schema';

export type AuthUser = {
  userId: string;
  username: string;
  role: Role;
  schoolId?: string;
};

export interface DashboardStats {
  role: string;
  general: {
    totalWorkshops: number;
    approvedWorkshops: number;
    inReviewWorkshops: number;
    draftWorkshops: number;
  };
  admin?: {
    totalUsers: number;
    usersByRole: Record<string, number>;
    pendingRequests: number;
    recentActivity: Array<{
      type: string;
      description: string;
      date: Date;
    }>;
  };
  teacher?: {
    myWorkshops: number;
    myDrafts: number;
    myInReview: number;
    myApproved: number;
    pendingGrades: number;
    testsCreated: number;
  };
  reviewer?: {
    pendingReview: number;
    pendingRequests: number;
    reviewedThisWeek: number;
  };
  experienceManager?: {
    activeMedals: number;
    activeAvatarStyles: number;
  };
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Workshop.name)
    private readonly workshopModel: Model<WorkshopDocument>,
    @InjectModel(Test.name) private readonly testModel: Model<TestDocument>,
    @InjectModel(TestAttempt.name)
    private readonly attemptModel: Model<TestAttemptDocument>,
  ) {}

  async getStatsForUser(user: AuthUser): Promise<DashboardStats> {
    const schoolId = user.schoolId ?? 'default';

    // General stats for all staff
    const [
      totalWorkshops,
      approvedWorkshops,
      inReviewWorkshops,
      draftWorkshops,
    ] = await Promise.all([
      this.workshopModel.countDocuments({ schoolId }).exec(),
      this.workshopModel
        .countDocuments({ schoolId, status: 'approved' })
        .exec(),
      this.workshopModel
        .countDocuments({ schoolId, status: 'in_review' })
        .exec(),
      this.workshopModel.countDocuments({ schoolId, status: 'draft' }).exec(),
    ]);

    const stats: DashboardStats = {
      role: user.role,
      general: {
        totalWorkshops,
        approvedWorkshops,
        inReviewWorkshops,
        draftWorkshops,
      },
    };

    // Role-specific stats
    if (user.role === Role.Admin) {
      stats.admin = await this.getAdminStats(schoolId);
    }

    if (user.role === Role.Teacher || user.role === Role.Admin) {
      stats.teacher = await this.getTeacherStats(user.userId, schoolId);
    }

    if (user.role === Role.Reviewer || user.role === Role.Admin) {
      stats.reviewer = await this.getReviewerStats(schoolId);
    }

    if (user.role === Role.ExperienceManager || user.role === Role.Admin) {
      stats.experienceManager = {
        activeMedals: 0,
        activeAvatarStyles: 0,
      };
    }

    return stats;
  }

  private async getAdminStats(schoolId: string) {
    const [
      totalUsers,
      students,
      teachers,
      reviewers,
      admins,
      experienceManagers,
    ] = await Promise.all([
      this.userModel.countDocuments({ schoolId }).exec(),
      this.userModel.countDocuments({ schoolId, role: Role.Student }).exec(),
      this.userModel.countDocuments({ schoolId, role: Role.Teacher }).exec(),
      this.userModel.countDocuments({ schoolId, role: Role.Reviewer }).exec(),
      this.userModel.countDocuments({ schoolId, role: Role.Admin }).exec(),
      this.userModel
        .countDocuments({ schoolId, role: Role.ExperienceManager })
        .exec(),
    ]);

    const pendingRequests = await this.workshopModel
      .countDocuments({
        schoolId,
        $or: [{ editRequestPending: true }, { deleteRequestPending: true }],
      })
      .exec();

    // Get recent activity (last 5 approved/rejected workshops)
    const recentWorkshops = await this.workshopModel
      .find({ schoolId, status: { $in: ['approved'] } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title status updatedAt')
      .exec();

    const recentActivity = recentWorkshops.map((w) => ({
      type: 'workshop',
      description: `Taller "${w.title}" aprobado`,
      date: (w as any).updatedAt || new Date(),
    }));

    return {
      totalUsers,
      usersByRole: {
        student: students,
        teacher: teachers,
        reviewer: reviewers,
        admin: admins,
        experience_manager: experienceManagers,
      },
      pendingRequests,
      recentActivity,
    };
  }

  private async getTeacherStats(userId: string, schoolId: string) {
    const [myWorkshops, myDrafts, myInReview, myApproved] = await Promise.all([
      this.workshopModel
        .countDocuments({
          schoolId,
          $or: [
            { createdByUserId: userId },
            { 'collaborators.userId': userId },
          ],
        })
        .exec(),
      this.workshopModel
        .countDocuments({
          schoolId,
          status: 'draft',
          $or: [
            { createdByUserId: userId },
            { 'collaborators.userId': userId },
          ],
        })
        .exec(),
      this.workshopModel
        .countDocuments({
          schoolId,
          status: 'in_review',
          $or: [
            { createdByUserId: userId },
            { 'collaborators.userId': userId },
          ],
        })
        .exec(),
      this.workshopModel
        .countDocuments({
          schoolId,
          status: 'approved',
          $or: [
            { createdByUserId: userId },
            { 'collaborators.userId': userId },
          ],
        })
        .exec(),
    ]);

    // Get tests created by this teacher
    const testsCreated = await this.testModel
      .countDocuments({
        createdByUserId: userId,
      })
      .exec();

    // Get pending grades (attempts needing manual review)
    const pendingGrades = await this.attemptModel
      .countDocuments({
        gradedByUserId: null,
        needsManualReview: true,
      })
      .exec();

    return {
      myWorkshops,
      myDrafts,
      myInReview,
      myApproved,
      pendingGrades,
      testsCreated,
    };
  }

  private async getReviewerStats(schoolId: string) {
    const pendingReview = await this.workshopModel
      .countDocuments({
        schoolId,
        status: 'in_review',
      })
      .exec();

    const pendingRequests = await this.workshopModel
      .countDocuments({
        schoolId,
        $or: [{ editRequestPending: true }, { deleteRequestPending: true }],
      })
      .exec();

    // Get workshops reviewed this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const reviewedThisWeek = await this.workshopModel
      .countDocuments({
        schoolId,
        status: 'approved',
        updatedAt: { $gte: oneWeekAgo },
      })
      .exec();

    return {
      pendingReview,
      pendingRequests,
      reviewedThisWeek,
    };
  }
}
