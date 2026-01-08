import { IsString, IsEnum, IsOptional, IsBoolean, IsUUID, MinLength } from 'class-validator';
import { Severity, Status } from '@prisma/client';

export class CreateIncidentDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Severity)
  severity: Severity;

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


