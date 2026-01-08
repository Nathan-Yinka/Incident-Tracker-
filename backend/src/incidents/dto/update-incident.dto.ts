import { IsString, IsEnum, IsOptional, IsBoolean, IsUUID, MinLength } from 'class-validator';
import { Severity, Status } from '@prisma/client';

export class UpdateIncidentDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity;

  @IsEnum(Status)
  @IsOptional()
  status?: Status;

  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}


