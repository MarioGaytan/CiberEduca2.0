import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/roles.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(Role.Admin)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const created = await this.usersService.createUser(dto);
    const obj = created.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshTokenHash, ...safe } = obj;
    return safe;
  }

  @Get()
  list(
    @Req() req: { user: { schoolId?: string } },
    @Query('schoolId') schoolId?: string,
  ) {
    const effectiveSchoolId = schoolId ?? req.user.schoolId;
    return this.usersService.listUsers({ schoolId: effectiveSchoolId });
  }
}
