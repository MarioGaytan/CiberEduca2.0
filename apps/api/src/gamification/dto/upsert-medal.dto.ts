import { IsString, IsNumber, IsBoolean, IsOptional, IsIn, Min } from 'class-validator';

export class UpsertMedalDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsString()
  icon!: string;

  @IsOptional()
  @IsString()
  @IsIn(['emoji', 'lucide', 'svg'])
  iconType?: string;

  @IsOptional()
  @IsString()
  iconColor?: string;

  @IsOptional()
  @IsString()
  bgColor?: string;

  @IsOptional()
  @IsString()
  borderColor?: string;

  @IsOptional()
  @IsString()
  @IsIn(['circle', 'shield', 'star', 'hexagon', 'diamond', 'badge'])
  shape?: string;

  @IsOptional()
  @IsBoolean()
  glow?: boolean;

  @IsNumber()
  @Min(0)
  xpReward!: number;

  @IsString()
  conditionType!: string;

  @IsNumber()
  @Min(0)
  conditionValue!: number;

  @IsOptional()
  @IsString()
  @IsIn(['gte', 'lte', 'eq'])
  conditionOperator?: string;

  @IsBoolean()
  isActive!: boolean;

  @IsNumber()
  sortOrder!: number;
}
