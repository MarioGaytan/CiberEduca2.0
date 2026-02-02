import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/roles.enum';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { AddCollaboratorDto, RemoveCollaboratorDto, RequestReasonDto } from './dto/collaborator.dto';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { ReviewFeedbackDto } from './dto/review-feedback.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { WorkshopsService } from './workshops.service';

@Controller('workshops')
@UseGuards(JwtAccessGuard, RolesGuard)
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Roles(Role.Teacher, Role.Admin)
  @Post()
  create(
    @Req() req: { user: any },
    @Body() dto: CreateWorkshopDto,
  ) {
    return this.workshopsService.create(req.user, dto);
  }

  @Roles(Role.Teacher, Role.Admin)
  @Patch(':id')
  updateDraft(
    @Req() req: { user: any },
    @Param('id') id: string,
    @Body() dto: UpdateWorkshopDto,
  ) {
    return this.workshopsService.updateDraft(req.user, id, dto);
  }

  @Roles(Role.Teacher, Role.Admin)
  @Post(':id/submit')
  submit(@Req() req: { user: any }, @Param('id') id: string) {
    return this.workshopsService.submitForReview(req.user, id);
  }

  @Roles(Role.Reviewer, Role.Admin)
  @Post(':id/approve')
  approve(
    @Req() req: { user: any },
    @Param('id') id: string,
    @Body() dto: ReviewFeedbackDto,
  ) {
    return this.workshopsService.approve(req.user, id, dto.feedback);
  }

  @Roles(Role.Reviewer, Role.Admin)
  @Post(':id/reject')
  reject(
    @Req() req: { user: any },
    @Param('id') id: string,
    @Body() dto: ReviewFeedbackDto,
  ) {
    return this.workshopsService.reject(req.user, id, dto.feedback);
  }

  @Roles(Role.Student, Role.Teacher, Role.Reviewer, Role.Admin)
  @Get()
  list(@Req() req: { user: any }) {
    return this.workshopsService.listForUser(req.user);
  }

  @Roles(Role.Reviewer, Role.Admin)
  @Get('in-review')
  listInReview(@Req() req: { user: any }) {
    return this.workshopsService.listInReview(req.user);
  }

  @Roles(Role.Teacher, Role.Reviewer, Role.Admin)
  @Get('my-editable')
  listEditable(@Req() req: { user: any }) {
    return this.workshopsService.listEditableForUser(req.user);
  }

  @Roles(Role.Student, Role.Teacher, Role.Reviewer, Role.Admin)
  @Get(':id')
  getById(@Req() req: { user: any }, @Param('id') id: string) {
    return this.workshopsService.getByIdForUser(req.user, id);
  }

  @Roles(Role.Student, Role.Teacher, Role.Reviewer, Role.Admin)
  @Get(':id/by-code')
  getByCode(
    @Req() req: { user: any },
    @Param('id') id: string,
    @Query('code') code?: string,
  ) {
    if (!code) {
      throw new BadRequestException('Falta el parámetro code.');
    }
    return this.workshopsService.getByCode(req.user, id, code);
  }

  // ==================== NEW ENDPOINTS ====================

  @Roles(Role.Reviewer, Role.Admin)
  @Get('admin/pending-requests')
  listPendingRequests(@Req() req: { user: any }) {
    return this.workshopsService.listPendingRequests(req.user);
  }

  @Roles(Role.Teacher, Role.Admin)
  @Post(':id/request-edit')
  requestEdit(
    @Req() req: { user: any },
    @Param('id') id: string,
    @Body() dto: RequestReasonDto,
  ) {
    return this.workshopsService.requestEdit(req.user, id, dto.reason);
  }

  @Roles(Role.Reviewer, Role.Admin)
  @Post(':id/approve-edit')
  approveEditRequest(@Req() req: { user: any }, @Param('id') id: string) {
    return this.workshopsService.approveEditRequest(req.user, id);
  }

  @Roles(Role.Teacher, Role.Admin)
  @Post(':id/request-delete')
  requestDelete(
    @Req() req: { user: any },
    @Param('id') id: string,
    @Body() dto: RequestReasonDto,
  ) {
    return this.workshopsService.requestDelete(req.user, id, dto.reason);
  }

  @Roles(Role.Reviewer, Role.Admin)
  @Delete(':id')
  approveDelete(@Req() req: { user: any }, @Param('id') id: string) {
    return this.workshopsService.approveDelete(req.user, id);
  }

  @Roles(Role.Teacher, Role.Admin)
  @Post(':id/collaborators')
  addCollaborator(
    @Req() req: { user: any },
    @Param('id') id: string,
    @Body() dto: AddCollaboratorDto,
  ) {
    return this.workshopsService.addCollaborator(req.user, id, dto.userId, dto.role);
  }

  @Roles(Role.Teacher, Role.Admin)
  @Delete(':id/collaborators/:userId')
  removeCollaborator(
    @Req() req: { user: any },
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.workshopsService.removeCollaborator(req.user, id, userId);
  }
}
