import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '../common/roles.enum';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    const username = this.config.get<string>('BOOTSTRAP_ADMIN_USERNAME');
    const password = this.config.get<string>('BOOTSTRAP_ADMIN_PASSWORD');
    const email = this.config.get<string>('BOOTSTRAP_ADMIN_EMAIL');
    const schoolId =
      this.config.get<string>('BOOTSTRAP_ADMIN_SCHOOL_ID') ??
      this.config.get<string>('DEFAULT_SCHOOL_ID') ??
      'default';

    if (!username || !password) {
      this.logger.log(
        'Admin bootstrap disabled (BOOTSTRAP_ADMIN_USERNAME/PASSWORD not set).',
      );
      return;
    }

    const adminCount = await this.usersService.countByRole(Role.Admin);
    if (adminCount > 0) {
      this.logger.log('Admin bootstrap skipped (admin already exists).');
      return;
    }

    await this.usersService.createUser({
      username,
      password,
      email,
      role: Role.Admin,
      schoolId,
    });

    this.logger.warn(
      'Admin bootstrap: admin created. For security, remove BOOTSTRAP_ADMIN_* from .env after verifying access.',
    );
  }
}
