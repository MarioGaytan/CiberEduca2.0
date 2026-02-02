import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/roles.enum';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAccessGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.Admin)
  async create(@Body() dto: CreateUserDto) {
    const created = await this.usersService.createUser(dto);
    const obj = created.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshTokenHash, ...safe } = obj;
    return safe;
  }

  @Get()
  @Roles(Role.Admin)
  list(
    @Req() req: { user: { schoolId?: string } },
    @Query('schoolId') schoolId?: string,
  ) {
    const effectiveSchoolId = schoolId ?? req.user.schoolId;
    return this.usersService.listUsers({ schoolId: effectiveSchoolId });
  }

  @Get('teachers')
  @Roles(Role.Teacher, Role.Admin)
  async searchTeachers(
    @Req() req: { user: { schoolId?: string } },
    @Query('q') query?: string,
  ) {
    const schoolId = req.user.schoolId;
    const teachers = await this.usersService.searchTeachers(schoolId, query);
    return teachers.map((t) => ({
      _id: t._id,
      username: t.username,
      role: t.role,
    }));
  }

  @Patch('me/profile')
  async updateMyProfile(
    @Req() req: { user: { userId: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    const updated = await this.usersService.updateProfile(req.user.userId, dto);
    if (!updated) {
      throw new BadRequestException('No se pudo actualizar el perfil.');
    }
    return {
      _id: updated._id,
      username: updated.username,
      email: updated.email,
      role: updated.role,
    };
  }

  @Patch('me/password')
  async changeMyPassword(
    @Req() req: { user: { userId: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    const success = await this.usersService.changePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
    if (!success) {
      throw new BadRequestException('La contraseña actual es incorrecta.');
    }
    return { ok: true, message: 'Contraseña actualizada correctamente.' };
  }
}
