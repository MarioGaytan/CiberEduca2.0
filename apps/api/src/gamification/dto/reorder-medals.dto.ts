import { IsArray, IsString } from 'class-validator';

export class ReorderMedalsDto {
  @IsArray()
  @IsString({ each: true })
  medalIds!: string[];
}
