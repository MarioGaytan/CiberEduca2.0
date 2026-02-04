import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/roles.enum';
import { CreateTestDto } from './dto/create-test.dto';
import { GradeAttemptDto } from './dto/grade-attempt.dto';
import { ReviewFeedbackDto } from './dto/review-feedback.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { TestsService } from './tests.service';

@Controller('tests')
@UseGuards(JwtAccessGuard, RolesGuard)
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Roles(Role.Teacher, Role.Admin)
  @Post()
  create(@Req() req: { user: any }, @Body() dto: CreateTestDto) {
    return this.testsService.create(req.user, {
      workshopId: dto.workshopId,
      title: dto.title,
      description: dto.description,
      questions: dto.questions as any,
    });
  }

  @Roles(Role.Teacher, Role.Admin)
  @Patch(':id')
  updateDraft(
    @Req() req: { user: any },
    @Param('id') id: string,
    @Body() dto: UpdateTestDto,
  ) {
    return this.testsService.updateDraft(req.user, id, {
      title: dto.title,
      description: dto.description,
      questions: dto.questions as any,
    });
  }

  @Roles(Role.Teacher, Role.Admin)
  @Post(':id/submit')
  submit(@Req() req: { user: any }, @Param('id') id: string) {
    return this.testsService.submitForReview(req.user, id);
  }

  @Roles(Role.Reviewer, Role.Admin)
  @Post(':id/approve')
  approve(
    @Req() req: { user: any },
    @Param('id') id: string,
    @Body() dto: ReviewFeedbackDto,
  ) {
    return this.testsService.approve(req.user, id, dto.feedback);
  }

  @Roles(Role.Reviewer, Role.Admin)
  @Post(':id/reject')
  reject(
    @Req() req: { user: any },
    @Param('id') id: string,
    @Body() dto: ReviewFeedbackDto,
  ) {
    return this.testsService.reject(req.user, id, dto.feedback);
  }

  @Roles(Role.Student, Role.Teacher, Role.Reviewer, Role.Admin)
  @Get('workshop/:workshopId')
  listByWorkshop(
    @Req() req: { user: any },
    @Param('workshopId') workshopId: string,
  ) {
    return this.testsService.listForUser(req.user, workshopId);
  }

  @Roles(Role.Teacher, Role.Admin)
  @Get('inbox/attempts')
  inboxAttempts(@Req() req: { user: any }) {
    return this.testsService.listPendingManualAttempts(req.user);
  }

  @Roles(Role.Reviewer, Role.Admin)
  @Get('in-review')
  listInReview(@Req() req: { user: any }) {
    return this.testsService.listInReview(req.user);
  }

  @Roles(Role.Student, Role.Teacher, Role.Reviewer, Role.Admin)
  @Get(':id')
  getForTaking(@Req() req: { user: any }, @Param('id') id: string) {
    return this.testsService.getForTaking(req.user, id);
  }

  @Roles(Role.Student)
  @Post(':id/attempts')
  submitAttempt(
    @Req() req: { user: any },
    @Param('id') id: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.testsService.submitAttempt(req.user, id, dto);
  }

  @Roles(Role.Teacher, Role.Admin)
  @Post('attempts/:attemptId/grade')
  gradeAttempt(
    @Req() req: { user: any },
    @Param('attemptId') attemptId: string,
    @Body() dto: GradeAttemptDto,
  ) {
    return this.testsService.gradeAttempt(req.user, attemptId, dto.grades);
  }

  @Roles(Role.Teacher, Role.Admin)
  @Get(':id/attempts')
  listAttempts(@Req() req: { user: any }, @Param('id') id: string) {
    return this.testsService.listAttemptsForTeacher(req.user, id);
  }
}
