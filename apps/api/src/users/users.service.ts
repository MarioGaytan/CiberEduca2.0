import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { Role } from '../common/roles.enum';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    private readonly config: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private getDefaultSchoolId(): string {
    return this.config.get<string>('DEFAULT_SCHOOL_ID') ?? 'default';
  }

  async countByRole(role: Role): Promise<number> {
    return this.userModel.countDocuments({ role }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByUsernameOrEmail(
    identifier: string,
  ): Promise<UserDocument | null> {
    const normalized = identifier.trim().toLowerCase();
    return this.userModel
      .findOne({ $or: [{ username: normalized }, { email: normalized }] })
      .exec();
  }

  async createStudentUser(input: {
    username: string;
    password: string;
    email?: string;
    schoolId?: string;
  }): Promise<UserDocument> {
    return this.createUser({
      username: input.username,
      password: input.password,
      email: input.email,
      role: Role.Student,
      schoolId: input.schoolId,
    });
  }

  async createUser(input: {
    username: string;
    password: string;
    email?: string;
    role: Role;
    schoolId?: string;
  }): Promise<UserDocument> {
    const username = input.username.trim().toLowerCase();
    const email = input.email?.trim().toLowerCase();

    const existing = await this.userModel
      .findOne({ $or: [{ username }, ...(email ? [{ email }] : [])] })
      .exec();

    if (existing) {
      throw new ConflictException('El usuario o correo ya existe.');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const schoolId = input.schoolId ?? this.getDefaultSchoolId();

    const created = new this.userModel({
      username,
      email,
      passwordHash,
      role: input.role,
      schoolId,
      isActive: true,
    });

    return created.save();
  }

  async listUsers(filter?: { schoolId?: string }) {
    const query: Record<string, unknown> = {};
    if (filter?.schoolId) query.schoolId = filter.schoolId;

    return this.userModel
      .find(query)
      .select('-passwordHash -refreshTokenHash')
      .sort({ createdAt: -1 })
      .exec();
  }

  async setRefreshTokenHash(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await this.userModel
      .updateOne({ _id: userId }, { $set: { refreshTokenHash } })
      .exec();
  }

  async clearRefreshTokenHash(userId: string): Promise<void> {
    await this.userModel
      .updateOne({ _id: userId }, { $unset: { refreshTokenHash: 1 } })
      .exec();
  }

  async validatePassword(
    user: UserDocument,
    password: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async searchTeachers(
    schoolId?: string,
    query?: string,
  ): Promise<UserDocument[]> {
    const filter: Record<string, unknown> = {
      role: { $in: [Role.Teacher, Role.Admin, Role.Reviewer] },
      isActive: true,
    };
    if (schoolId) filter.schoolId = schoolId;
    if (query && query.trim()) {
      filter.username = { $regex: query.trim(), $options: 'i' };
    }

    return this.userModel
      .find(filter)
      .select('_id username role')
      .limit(20)
      .sort({ username: 1 })
      .exec();
  }

  async updateProfile(
    userId: string,
    data: { username?: string; email?: string },
  ): Promise<UserDocument | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    const updates: Record<string, unknown> = {};

    if (data.username && data.username.trim()) {
      const newUsername = data.username.trim().toLowerCase();
      if (newUsername !== user.username) {
        const existing = await this.userModel
          .findOne({ username: newUsername, _id: { $ne: userId } })
          .exec();
        if (existing) {
          throw new ConflictException('El nombre de usuario ya está en uso.');
        }
        updates.username = newUsername;
      }
    }

    if (data.email !== undefined) {
      const newEmail = data.email?.trim().toLowerCase() || null;
      if (newEmail !== user.email) {
        if (newEmail) {
          const existing = await this.userModel
            .findOne({ email: newEmail, _id: { $ne: userId } })
            .exec();
          if (existing) {
            throw new ConflictException(
              'El correo electrónico ya está en uso.',
            );
          }
        }
        updates.email = newEmail;
      }
    }

    if (Object.keys(updates).length === 0) {
      return user;
    }

    return this.userModel
      .findByIdAndUpdate(userId, { $set: updates }, { new: true })
      .select('-passwordHash -refreshTokenHash')
      .exec();
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return false;

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) return false;

    const newHash = await bcrypt.hash(newPassword, 12);
    await this.userModel
      .updateOne({ _id: userId }, { $set: { passwordHash: newHash } })
      .exec();

    return true;
  }
}
