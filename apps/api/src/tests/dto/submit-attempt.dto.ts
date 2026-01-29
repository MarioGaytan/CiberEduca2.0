import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitAttemptAnswerDto {
  @IsInt()
  @Min(0)
  questionIndex!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  selectedOptionIndex?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  textAnswer?: string;
}

export class SubmitAttemptDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SubmitAttemptAnswerDto)
  answers!: SubmitAttemptAnswerDto[];
}
