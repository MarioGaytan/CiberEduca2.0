import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewFeedbackDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  feedback?: string;
}
