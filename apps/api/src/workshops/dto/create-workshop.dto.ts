import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { WorkshopVisibility } from '../workshop.enums';

export class CreateWorkshopDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(WorkshopVisibility)
  visibility?: WorkshopVisibility;

  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(32)
  accessCode?: string;
}
