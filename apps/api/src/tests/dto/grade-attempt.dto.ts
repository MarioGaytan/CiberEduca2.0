import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GradeAnswerDto {
  @IsInt()
  @Min(0)
  questionIndex!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  awardedPoints!: number;
}

export class GradeAttemptDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => GradeAnswerDto)
  grades!: GradeAnswerDto[];
}
