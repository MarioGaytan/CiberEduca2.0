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

export class CreateTestQuestionOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  text!: string;
}

export class CreateTestQuestionDto {
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
  @Type(() => CreateTestQuestionOptionDto)
  options?: CreateTestQuestionOptionDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  correctOptionIndex?: number;
}

export class CreateTestDto {
  @IsString()
  workshopId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateTestQuestionDto)
  questions!: CreateTestQuestionDto[];
}
