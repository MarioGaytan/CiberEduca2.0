import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CollaboratorRole } from '../schemas/workshop.schema';

export class AddCollaboratorDto {
  @IsMongoId()
  userId!: string;

  @IsEnum(CollaboratorRole)
  role!: CollaboratorRole;
}

export class RemoveCollaboratorDto {
  @IsMongoId()
  userId!: string;
}

export class RequestReasonDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
