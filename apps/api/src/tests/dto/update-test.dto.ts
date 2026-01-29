import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType } from '../test.enums';

export class UpdateTestQuestionOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  text!: string;
}

export class UpdateTestQuestionDto {
  @IsEnum(QuestionType)
  type!: QuestionType;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  prompt!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  points!: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => UpdateTestQuestionOptionDto)
  options?: UpdateTestQuestionOptionDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  correctOptionIndex?: number;
}

export class UpdateTestDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => UpdateTestQuestionDto)
  questions?: UpdateTestQuestionDto[];
}
