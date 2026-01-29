import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { SignOptions } from 'jsonwebtoken';
import { UsersService } from '../users/users.service';

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private async signTokens(user: {
    userId: string;
    username: string;
    role: string;
    schoolId?: string;
  }): Promise<TokenPair> {
    const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');

    if (!accessSecret || !refreshSecret) {
      throw new UnauthorizedException('Config JWT inválida.');
    }

    const accessExpiresIn =
      (this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m') as SignOptions['expiresIn'];
    const refreshExpiresIn =
      (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as SignOptions['expiresIn'];

    const payload = { sub: user.userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, { secret: accessSecret, expiresIn: accessExpiresIn }),
      this.jwt.signAsync(payload, { secret: refreshSecret, expiresIn: refreshExpiresIn }),
    ]);

    await this.usersService.setRefreshTokenHash(user.userId, refreshToken);

    return { accessToken, refreshToken };
  }

  async register(input: {
    username: string;
    password: string;
    email?: string;
    schoolId?: string;
  }) {
    const user = await this.usersService.createStudentUser(input);

    return this.signTokens({
      userId: String(user._id),
      username: user.username,
      role: user.role,
      schoolId: user.schoolId,
    });
  }

  async login(identifier: string, password: string) {
    const user = await this.usersService.findByUsernameOrEmail(identifier);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const ok = await this.usersService.validatePassword(user, password);
    if (!ok) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    return this.signTokens({
      userId: String(user._id),
      username: user.username,
      role: user.role,
      schoolId: user.schoolId,
    });
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh inválido.');
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedException('Refresh inválido.');
    }

    return this.signTokens({
      userId: String(user._id),
      username: user.username,
      role: user.role,
      schoolId: user.schoolId,
    });
  }

  async logout(userId: string) {
    await this.usersService.clearRefreshTokenHash(userId);
    return { ok: true };
  }
}
