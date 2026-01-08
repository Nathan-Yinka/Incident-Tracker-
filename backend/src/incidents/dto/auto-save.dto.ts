import { IsString, IsEnum, IsOptional } from 'class-validator';
import { Severity } from '@prisma/client';

export class AutoSaveDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity;
}

