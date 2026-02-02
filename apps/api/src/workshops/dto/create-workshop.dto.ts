import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentBlockType } from '../schemas/workshop.schema';
import { WorkshopVisibility } from '../workshop.enums';

export class ContentBlockDto {
  @IsEnum(ContentBlockType)
  type!: ContentBlockType;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  content?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string;
}

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

  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  objectives?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(480)
  estimatedMinutes?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentBlockDto)
  content?: ContentBlockDto[];
}
