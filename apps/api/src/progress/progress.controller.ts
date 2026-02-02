import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/roles.enum';
import { ProgressService } from './progress.service';

@Controller('progress')
@UseGuards(JwtAccessGuard, RolesGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Roles(Role.Student, Role.Teacher, Role.Admin)
  @Get('me')
  async getMyProgress(@Req() req: { user: any }) {
    return this.progressService.getMyProgress(req.user);
  }

  @Roles(Role.Student, Role.Teacher, Role.Admin)
  @Get('ranking')
  async getRanking(
    @Req() req: { user: any },
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.progressService.getRanking(req.user, parsedLimit);
  }

  @Roles(Role.Student, Role.Teacher, Role.Admin)
  @Get('medals')
  async getMedals(@Req() req: { user: any }) {
    return this.progressService.getMedals(req.user);
  }

  @Roles(Role.Student)
  @Patch('avatar')
  async updateAvatar(
    @Req() req: { user: any },
    @Body() body: { base?: string; color?: string; frame?: string; accessories?: string[] },
  ) {
    return this.progressService.updateAvatar(req.user, body);
  }
}
