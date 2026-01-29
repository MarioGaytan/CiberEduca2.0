import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.identifier, dto.password);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(@Req() req: { user: { userId: string; refreshToken: string } }) {
    return this.authService.refresh(req.user.userId, req.user.refreshToken);
  }

  @UseGuards(JwtAccessGuard)
  @Post('logout')
  logout(@Req() req: { user: { userId: string } }) {
    return this.authService.logout(req.user.userId);
  }

  @UseGuards(JwtAccessGuard)
  @Get('me')
  me(@Req() req: { user: unknown }) {
    return req.user;
  }
}
