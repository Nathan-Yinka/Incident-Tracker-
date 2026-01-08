import { IsUUID } from 'class-validator';

export class AssignIncidentDto {
  @IsUUID()
  assignedToId: string;
}


