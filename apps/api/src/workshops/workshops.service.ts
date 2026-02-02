import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { Role } from '../common/roles.enum';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Workshop, WorkshopDocument, ContentBlock, ContentBlockType, CollaboratorRole, HistoryEntry } from './schemas/workshop.schema';
import { WorkshopStatus, WorkshopVisibility } from './workshop.enums';

export type AuthUser = {
  userId: string;
  username: string;
  role: Role;
  schoolId?: string;
};

@Injectable()
export class WorkshopsService {
  constructor(
    private readonly config: ConfigService,
    @InjectModel(Workshop.name)
    private readonly workshopModel: Model<WorkshopDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // Helper to get username by userId
  private async getUsernameMap(userIds: string[]): Promise<Record<string, string>> {
    const uniqueIds = [...new Set(userIds.filter(id => id))];
    if (uniqueIds.length === 0) return {};
    const users = await this.userModel.find({ _id: { $in: uniqueIds } }).select('_id username').exec();
    const map: Record<string, string> = {};
    for (const u of users) {
      map[(u._id as any).toString()] = u.username;
    }
    return map;
  }

  // Enrich workshop with user names instead of IDs
  private async enrichWorkshop(workshop: WorkshopDocument) {
    const userIds: string[] = [
      workshop.createdByUserId,
      workshop.approvedByUserId,
      workshop.deletedByUserId,
      workshop.editRequestedByUserId,
      workshop.deleteRequestedByUserId,
      ...(workshop.collaborators?.map(c => c.userId) || []),
      ...(workshop.collaborators?.map(c => c.addedByUserId) || []),
      ...(workshop.content?.map(c => c.createdByUserId) || []),
      ...(workshop.content?.map(c => c.lastModifiedByUserId) || []),
      ...(workshop.history?.map(h => h.userId) || []),
    ].filter(Boolean) as string[];

    const usernameMap = await this.getUsernameMap(userIds);
    const obj = workshop.toObject();

    return {
      ...obj,
      createdByUsername: usernameMap[workshop.createdByUserId] || null,
      approvedByUsername: workshop.approvedByUserId ? usernameMap[workshop.approvedByUserId] || null : null,
      collaborators: obj.collaborators?.map((c: any) => ({
        ...c,
        username: usernameMap[c.userId] || null,
        addedByUsername: c.addedByUserId ? usernameMap[c.addedByUserId] || null : null,
      })),
      content: obj.content?.map((block: any) => ({
        ...block,
        createdByUsername: block.createdByUserId ? usernameMap[block.createdByUserId] || null : null,
        lastModifiedByUsername: block.lastModifiedByUserId ? usernameMap[block.lastModifiedByUserId] || null : null,
      })),
      history: obj.history?.map((h: any) => ({
        ...h,
        username: usernameMap[h.userId] || null,
      })),
    };
  }

  // Add history entry
  private addHistory(workshop: WorkshopDocument, userId: string, action: string, details?: string) {
    if (!workshop.history) workshop.history = [];
    workshop.history.push({
      userId,
      action,
      details,
      timestamp: new Date(),
    } as HistoryEntry);
  }

  private requireSchoolId(user: AuthUser): string {
    return user.schoolId ?? (this.config.get<string>('DEFAULT_SCHOOL_ID') ?? 'default');
  }

  async create(user: AuthUser, input: {
    title: string;
    description?: string;
    coverImageUrl?: string;
    objectives?: string[];
    estimatedMinutes?: number;
    content?: ContentBlock[];
    visibility?: WorkshopVisibility;
    accessCode?: string;
  }) {
    const schoolId = this.requireSchoolId(user);
    const visibility = input.visibility ?? WorkshopVisibility.Internal;

    let accessCodeHash: string | undefined;
    if (visibility === WorkshopVisibility.Code) {
      if (!input.accessCode) {
        throw new BadRequestException('Se requiere accessCode para talleres por código.');
      }
      accessCodeHash = await bcrypt.hash(input.accessCode, 12);
    }

    // Validate content blocks
    if (input.content) {
      this.validateContentBlocks(input.content);
    }

    // Add metadata to content blocks
    const now = new Date();
    const contentWithMeta = (input.content || []).map(block => ({
      ...block,
      createdByUserId: user.userId,
      createdAt: now,
      lastModifiedByUserId: user.userId,
      lastModifiedAt: now,
    }));

    const created = new this.workshopModel({
      schoolId,
      createdByUserId: user.userId,
      title: input.title,
      description: input.description,
      coverImageUrl: input.coverImageUrl,
      objectives: input.objectives?.filter(o => o.trim()),
      estimatedMinutes: input.estimatedMinutes,
      content: contentWithMeta,
      status: WorkshopStatus.Draft,
      visibility,
      accessCodeHash,
      history: [{
        userId: user.userId,
        action: 'created',
        details: `Taller "${input.title}" creado`,
        timestamp: now,
      }],
    });

    const saved = await created.save();
    return this.enrichWorkshop(saved);
  }

  private validateContentBlocks(blocks: ContentBlock[]) {
    for (const block of blocks) {
      if (!Object.values(ContentBlockType).includes(block.type)) {
        throw new BadRequestException(`Tipo de bloque inválido: ${block.type}`);
      }
      if (block.type === ContentBlockType.YouTube && block.url) {
        // Validate YouTube URL format
        const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/;
        if (!ytRegex.test(block.url)) {
          throw new BadRequestException('URL de YouTube inválida.');
        }
      }
      if (block.type === ContentBlockType.Image && block.url) {
        // Basic URL validation
        try {
          new URL(block.url);
        } catch {
          throw new BadRequestException('URL de imagen inválida.');
        }
      }
    }
  }

  // Check if user can edit workshop (owner, admin, or editor collaborator)
  private canEdit(user: AuthUser, workshop: WorkshopDocument): boolean {
    if (user.role === Role.Admin) return true;
    if (workshop.createdByUserId === user.userId) return true;
    const collab = workshop.collaborators?.find(c => c.userId === user.userId);
    if (collab && collab.role === CollaboratorRole.Editor) return true;
    return false;
  }

  async updateDraft(user: AuthUser, workshopId: string, input: {
    title?: string;
    description?: string;
    coverImageUrl?: string;
    objectives?: string[];
    estimatedMinutes?: number;
    content?: ContentBlock[];
    visibility?: WorkshopVisibility;
    accessCode?: string;
  }) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop) throw new NotFoundException('Taller no encontrado.');
    if (workshop.isDeleted) throw new NotFoundException('Taller no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (workshop.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este taller.');
    }

    if (!this.canEdit(user, workshop)) {
      throw new ForbiddenException('No tienes permisos para editar este taller.');
    }

    // Allow editing if draft OR if edit was requested on approved workshop
    const canEditStatus = workshop.status === WorkshopStatus.Draft || 
      (workshop.status === WorkshopStatus.Approved && workshop.editRequested);
    if (!canEditStatus) {
      throw new BadRequestException('Solo puedes editar un taller en borrador o con solicitud de edición aprobada.');
    }

    if (input.title !== undefined) workshop.title = input.title;
    if (input.description !== undefined) workshop.description = input.description;
    if (input.coverImageUrl !== undefined) workshop.coverImageUrl = input.coverImageUrl || undefined;
    if (input.objectives !== undefined) workshop.objectives = input.objectives.filter(o => o.trim());
    if (input.estimatedMinutes !== undefined) workshop.estimatedMinutes = input.estimatedMinutes || undefined;
    
    const now = new Date();
    if (input.content !== undefined) {
      this.validateContentBlocks(input.content);
      // Preserve existing metadata or add new
      workshop.content = input.content.map((block, idx) => {
        const existing = workshop.content?.[idx];
        return {
          ...block,
          createdByUserId: existing?.createdByUserId || user.userId,
          createdAt: existing?.createdAt || now,
          lastModifiedByUserId: user.userId,
          lastModifiedAt: now,
        };
      });
    }

    if (input.visibility !== undefined) {
      workshop.visibility = input.visibility;
      if (input.visibility === WorkshopVisibility.Internal) {
        workshop.accessCodeHash = undefined;
      }
    }

    if (workshop.visibility === WorkshopVisibility.Code && input.accessCode) {
      workshop.accessCodeHash = await bcrypt.hash(input.accessCode, 12);
    }

    this.addHistory(workshop, user.userId, 'updated', 'Taller actualizado');
    const saved = await workshop.save();
    return this.enrichWorkshop(saved);
  }

  async submitForReview(user: AuthUser, workshopId: string) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop) throw new NotFoundException('Taller no encontrado.');
    if (workshop.isDeleted) throw new NotFoundException('Taller no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (workshop.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este taller.');
    }

    // Only owner or admin can submit for review
    if (workshop.createdByUserId !== user.userId && user.role !== Role.Admin) {
      throw new ForbiddenException('Solo el creador o admin puede enviar a revisión.');
    }

    if (workshop.status !== WorkshopStatus.Draft) {
      throw new BadRequestException('El taller no está en borrador.');
    }

    workshop.status = WorkshopStatus.InReview;
    workshop.reviewerFeedback = undefined;
    workshop.editRequested = false;
    this.addHistory(workshop, user.userId, 'submitted', 'Enviado a revisión');

    const saved = await workshop.save();
    return this.enrichWorkshop(saved);
  }

  async approve(user: AuthUser, workshopId: string, feedback?: string) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop) throw new NotFoundException('Taller no encontrado.');
    if (workshop.isDeleted) throw new NotFoundException('Taller no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (workshop.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este taller.');
    }

    if (![Role.Admin, Role.Reviewer].includes(user.role)) {
      throw new ForbiddenException('No tienes permisos para aprobar.');
    }

    if (workshop.status !== WorkshopStatus.InReview) {
      throw new BadRequestException('El taller no está en revisión.');
    }

    workshop.status = WorkshopStatus.Approved;
    workshop.reviewerFeedback = feedback;
    workshop.approvedByUserId = user.userId;
    workshop.approvedAt = new Date();
    workshop.editRequested = false;
    this.addHistory(workshop, user.userId, 'approved', feedback || 'Aprobado');

    const saved = await workshop.save();
    return this.enrichWorkshop(saved);
  }

  async reject(user: AuthUser, workshopId: string, feedback?: string) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop) throw new NotFoundException('Taller no encontrado.');
    if (workshop.isDeleted) throw new NotFoundException('Taller no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (workshop.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este taller.');
    }

    if (![Role.Admin, Role.Reviewer].includes(user.role)) {
      throw new ForbiddenException('No tienes permisos para rechazar.');
    }

    if (workshop.status !== WorkshopStatus.InReview) {
      throw new BadRequestException('El taller no está en revisión.');
    }

    workshop.status = WorkshopStatus.Draft;
    workshop.reviewerFeedback = feedback;
    this.addHistory(workshop, user.userId, 'rejected', feedback || 'Rechazado');

    const saved = await workshop.save();
    return this.enrichWorkshop(saved);
  }

  async listInReview(user: AuthUser) {
    if (![Role.Admin, Role.Reviewer].includes(user.role)) {
      throw new ForbiddenException('No tienes permisos.');
    }

    const schoolId = this.requireSchoolId(user);
    const workshops = await this.workshopModel
      .find({ schoolId, status: WorkshopStatus.InReview, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .exec();
    
    return Promise.all(workshops.map(w => this.enrichWorkshop(w)));
  }

  async listForUser(user: AuthUser) {
    const schoolId = this.requireSchoolId(user);
    const notDeleted = { isDeleted: { $ne: true } };

    let workshops: WorkshopDocument[];

    if ([Role.Admin, Role.Reviewer].includes(user.role)) {
      workshops = await this.workshopModel
        .find({ schoolId, ...notDeleted })
        .sort({ createdAt: -1 })
        .exec();
    } else if (user.role === Role.Teacher) {
      // Teachers see: their own workshops + collaborations + all approved workshops
      workshops = await this.workshopModel
        .find({
          schoolId,
          ...notDeleted,
          $or: [
            { createdByUserId: user.userId },
            { 'collaborators.userId': user.userId },
            { status: WorkshopStatus.Approved },
          ],
        })
        .sort({ createdAt: -1 })
        .exec();
    } else {
      // Students only see approved internal workshops
      workshops = await this.workshopModel
        .find({ schoolId, status: WorkshopStatus.Approved, visibility: WorkshopVisibility.Internal, ...notDeleted })
        .sort({ createdAt: -1 })
        .exec();
    }

    return Promise.all(workshops.map(w => this.enrichWorkshop(w)));
  }

  // List only editable workshops (drafts where user is owner or editor collaborator)
  async listEditableForUser(user: AuthUser) {
    const schoolId = this.requireSchoolId(user);
    const notDeleted = { isDeleted: { $ne: true } };

    if (user.role === Role.Student) {
      return [];
    }

    let workshops: WorkshopDocument[];

    if ([Role.Admin, Role.Reviewer].includes(user.role)) {
      // Admins see all drafts and in_review
      workshops = await this.workshopModel
        .find({
          schoolId,
          ...notDeleted,
          status: { $in: [WorkshopStatus.Draft, WorkshopStatus.InReview] },
        })
        .sort({ createdAt: -1 })
        .exec();
    } else {
      // Teachers see their own drafts + drafts where they're editor collaborators
      workshops = await this.workshopModel
        .find({
          schoolId,
          ...notDeleted,
          status: { $in: [WorkshopStatus.Draft, WorkshopStatus.InReview] },
          $or: [
            { createdByUserId: user.userId },
            { 'collaborators.userId': user.userId, 'collaborators.role': 'editor' },
          ],
        })
        .sort({ createdAt: -1 })
        .exec();
    }

    return Promise.all(workshops.map(w => this.enrichWorkshop(w)));
  }

  async getByIdForUser(user: AuthUser, workshopId: string) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop || workshop.isDeleted) throw new NotFoundException('Taller no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (workshop.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este taller.');
    }

    if ([Role.Admin, Role.Reviewer].includes(user.role)) {
      return this.enrichWorkshop(workshop);
    }

    if (user.role === Role.Teacher) {
      // Owner or collaborator can access
      const isOwner = workshop.createdByUserId === user.userId;
      const isCollab = workshop.collaborators?.some(c => c.userId === user.userId);
      if (!isOwner && !isCollab) {
        throw new ForbiddenException('No tienes acceso a este taller.');
      }
      return this.enrichWorkshop(workshop);
    }

    // Students: only approved workshops
    if (workshop.status !== WorkshopStatus.Approved) {
      throw new ForbiddenException('Taller no disponible.');
    }

    if (workshop.visibility === WorkshopVisibility.Internal) {
      return this.enrichWorkshop(workshop);
    }

    throw new ForbiddenException('Taller requiere código de acceso.');
  }

  async getByCode(user: AuthUser, workshopId: string, code: string) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop || workshop.isDeleted) throw new NotFoundException('Taller no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (workshop.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este taller.');
    }

    if (workshop.status !== WorkshopStatus.Approved) {
      throw new ForbiddenException('Taller no disponible.');
    }

    if (workshop.visibility !== WorkshopVisibility.Code || !workshop.accessCodeHash) {
      throw new BadRequestException('Este taller no es por código.');
    }

    const ok = await bcrypt.compare(code, workshop.accessCodeHash);
    if (!ok) {
      throw new ForbiddenException('Código inválido.');
    }

    return this.enrichWorkshop(workshop);
  }

  // ==================== NEW METHODS ====================

  // Request edit permission for an approved workshop
  async requestEdit(user: AuthUser, workshopId: string, reason?: string) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop || workshop.isDeleted) throw new NotFoundException('Taller no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (workshop.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este taller.');
    }

    // Only owner or admin can request edit
    if (workshop.createdByUserId !== user.userId && user.role !== Role.Admin) {
      throw new ForbiddenException('Solo el creador o admin puede solicitar edición.');
    }

    if (workshop.status !== WorkshopStatus.Approved) {
      throw new BadRequestException('Solo puedes solicitar edición de talleres aprobados.');
    }

    workshop.editRequested = true;
    workshop.editRequestedAt = new Date();
    workshop.editRequestedByUserId = user.userId;
    workshop.editRequestReason = reason;
    this.addHistory(workshop, user.userId, 'edit_requested', reason || 'Solicitud de edición');

    const saved = await workshop.save();
    return this.enrichWorkshop(saved);
  }

  // Approve edit request (by admin/reviewer)
  async approveEditRequest(user: AuthUser, workshopId: string) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop || workshop.isDeleted) throw new NotFoundException('Taller no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (workshop.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este taller.');
    }

    if (![Role.Admin, Role.Reviewer].includes(user.role)) {
      throw new ForbiddenException('No tienes permisos.');
    }

    if (!workshop.editRequested) {
      throw new BadRequestException('No hay solicitud de edición pendiente.');
    }

    // Move to draft for editing
    workshop.status = WorkshopStatus.Draft;
    this.addHistory(workshop, user.userId, 'edit_approved', 'Solicitud de edición aprobada');

    const saved = await workshop.save();
    return this.enrichWorkshop(saved);
  }

  // Request deletion of a workshop
  async requestDelete(user: AuthUser, workshopId: string, reason?: string) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop || workshop.isDeleted) throw new NotFoundException('Taller no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (workshop.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este taller.');
    }

    // Only owner or admin can request delete
    if (workshop.createdByUserId !== user.userId && user.role !== Role.Admin) {
      throw new ForbiddenException('Solo el creador o admin puede solicitar eliminación.');
    }

    workshop.deleteRequested = true;
    workshop.deleteRequestedAt = new Date();
    workshop.deleteRequestedByUserId = user.userId;
    workshop.deleteRequestReason = reason;
    this.addHistory(workshop, user.userId, 'delete_requested', reason || 'Solicitud de eliminación');

    const saved = await workshop.save();
    return this.enrichWorkshop(saved);
  }

  // Approve delete request / soft delete (by admin/reviewer)
  async approveDelete(user: AuthUser, workshopId: string) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop || workshop.isDeleted) throw new NotFoundException('Taller no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (workshop.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este taller.');
    }

    if (![Role.Admin, Role.Reviewer].includes(user.role)) {
      throw new ForbiddenException('No tienes permisos.');
    }

    workshop.isDeleted = true;
    workshop.deletedAt = new Date();
    workshop.deletedByUserId = user.userId;
    workshop.deleteRequested = false;
    this.addHistory(workshop, user.userId, 'deleted', 'Taller eliminado');

    const saved = await workshop.save();
    return this.enrichWorkshop(saved);
  }

  // Add collaborator
  async addCollaborator(user: AuthUser, workshopId: string, collaboratorUserId: string, role: CollaboratorRole) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop || workshop.isDeleted) throw new NotFoundException('Taller no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (workshop.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este taller.');
    }

    // Only owner or admin can add collaborators
    if (workshop.createdByUserId !== user.userId && user.role !== Role.Admin) {
      throw new ForbiddenException('Solo el creador o admin puede agregar colaboradores.');
    }

    // Check if user exists
    const targetUser = await this.userModel.findById(collaboratorUserId).exec();
    if (!targetUser) {
      throw new BadRequestException('Usuario no encontrado.');
    }

    // Check if already a collaborator
    if (workshop.collaborators?.some(c => c.userId === collaboratorUserId)) {
      throw new BadRequestException('El usuario ya es colaborador.');
    }

    // Cannot add owner as collaborator
    if (collaboratorUserId === workshop.createdByUserId) {
      throw new BadRequestException('El creador no puede ser colaborador.');
    }

    if (!workshop.collaborators) workshop.collaborators = [];
    workshop.collaborators.push({
      userId: collaboratorUserId,
      role,
      addedAt: new Date(),
      addedByUserId: user.userId,
    });

    this.addHistory(workshop, user.userId, 'collaborator_added', `Colaborador ${targetUser.username} agregado como ${role}`);

    const saved = await workshop.save();
    return this.enrichWorkshop(saved);
  }

  // Remove collaborator
  async removeCollaborator(user: AuthUser, workshopId: string, collaboratorUserId: string) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop || workshop.isDeleted) throw new NotFoundException('Taller no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (workshop.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este taller.');
    }

    // Only owner or admin can remove collaborators
    if (workshop.createdByUserId !== user.userId && user.role !== Role.Admin) {
      throw new ForbiddenException('Solo el creador o admin puede remover colaboradores.');
    }

    const idx = workshop.collaborators?.findIndex(c => c.userId === collaboratorUserId) ?? -1;
    if (idx === -1) {
      throw new BadRequestException('El usuario no es colaborador.');
    }

    workshop.collaborators!.splice(idx, 1);
    this.addHistory(workshop, user.userId, 'collaborator_removed', `Colaborador removido`);

    const saved = await workshop.save();
    return this.enrichWorkshop(saved);
  }

  // List pending requests (edit/delete) for admin/reviewer
  async listPendingRequests(user: AuthUser) {
    if (![Role.Admin, Role.Reviewer].includes(user.role)) {
      throw new ForbiddenException('No tienes permisos.');
    }

    const schoolId = this.requireSchoolId(user);
    const workshops = await this.workshopModel
      .find({
        schoolId,
        isDeleted: { $ne: true },
        $or: [{ editRequested: true }, { deleteRequested: true }],
      })
      .sort({ createdAt: -1 })
      .exec();

    return Promise.all(workshops.map(w => this.enrichWorkshop(w)));
  }
}
