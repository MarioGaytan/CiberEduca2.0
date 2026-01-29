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
import { Workshop, WorkshopDocument } from './schemas/workshop.schema';
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
  ) {}

  private requireSchoolId(user: AuthUser): string {
    return user.schoolId ?? (this.config.get<string>('DEFAULT_SCHOOL_ID') ?? 'default');
  }

  async create(user: AuthUser, input: {
    title: string;
    description?: string;
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

    const created = new this.workshopModel({
      schoolId,
      createdByUserId: user.userId,
      title: input.title,
      description: input.description,
      status: WorkshopStatus.Draft,
      visibility,
      accessCodeHash,
    });

    return created.save();
  }

  async updateDraft(user: AuthUser, workshopId: string, input: {
    title?: string;
    description?: string;
    visibility?: WorkshopVisibility;
    accessCode?: string;
  }) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop) throw new NotFoundException('Taller no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (workshop.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este taller.');
    }

    if (user.role !== Role.Admin && workshop.createdByUserId !== user.userId) {
      throw new ForbiddenException('Solo el creador o admin puede editar este taller.');
    }

    if (workshop.status !== WorkshopStatus.Draft) {
      throw new BadRequestException('Solo puedes editar un taller en borrador.');
    }

    if (input.title !== undefined) workshop.title = input.title;
    if (input.description !== undefined) workshop.description = input.description;

    if (input.visibility !== undefined) {
      workshop.visibility = input.visibility;
      if (input.visibility === WorkshopVisibility.Internal) {
        workshop.accessCodeHash = undefined;
      }
    }

    if (workshop.visibility === WorkshopVisibility.Code && input.accessCode) {
      workshop.accessCodeHash = await bcrypt.hash(input.accessCode, 12);
    }

    return workshop.save();
  }

  async submitForReview(user: AuthUser, workshopId: string) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop) throw new NotFoundException('Taller no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (workshop.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este taller.');
    }

    if (workshop.createdByUserId !== user.userId && user.role !== Role.Admin) {
      throw new ForbiddenException('Solo el creador o admin puede enviar a revisión.');
    }

    if (workshop.status !== WorkshopStatus.Draft) {
      throw new BadRequestException('El taller no está en borrador.');
    }

    workshop.status = WorkshopStatus.InReview;
    workshop.reviewerFeedback = undefined;

    return workshop.save();
  }

  async approve(user: AuthUser, workshopId: string, feedback?: string) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop) throw new NotFoundException('Taller no encontrado.');

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

    return workshop.save();
  }

  async reject(user: AuthUser, workshopId: string, feedback?: string) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop) throw new NotFoundException('Taller no encontrado.');

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

    return workshop.save();
  }

  async listForUser(user: AuthUser) {
    const schoolId = this.requireSchoolId(user);

    if ([Role.Admin, Role.Reviewer].includes(user.role)) {
      return this.workshopModel.find({ schoolId }).sort({ createdAt: -1 }).exec();
    }

    if (user.role === Role.Teacher) {
      return this.workshopModel
        .find({ schoolId, createdByUserId: user.userId })
        .sort({ createdAt: -1 })
        .exec();
    }

    return this.workshopModel
      .find({ schoolId, status: WorkshopStatus.Approved, visibility: WorkshopVisibility.Internal })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getByIdForUser(user: AuthUser, workshopId: string) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop) throw new NotFoundException('Taller no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (workshop.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este taller.');
    }

    if ([Role.Admin, Role.Reviewer].includes(user.role)) {
      return workshop;
    }

    if (user.role === Role.Teacher) {
      if (workshop.createdByUserId !== user.userId) {
        throw new ForbiddenException('No tienes acceso a este taller.');
      }
      return workshop;
    }

    if (workshop.status !== WorkshopStatus.Approved) {
      throw new ForbiddenException('Taller no disponible.');
    }

    if (workshop.visibility === WorkshopVisibility.Internal) return workshop;

    throw new ForbiddenException('Taller requiere código de acceso.');
  }

  async getByCode(user: AuthUser, workshopId: string, code: string) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop) throw new NotFoundException('Taller no encontrado.');

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

    return workshop;
  }
}
