import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../common/base/base.service';
import { LoggerService } from '../common/logger/logger.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { QueryIncidentsDto } from './dto/query-incidents.dto';
import { AutoSaveDto } from './dto/auto-save.dto';
import { AssignIncidentDto } from './dto/assign-incident.dto';
import { Incident, Status, Severity, Prisma } from '@prisma/client';

@Injectable()
export class IncidentsService extends BaseService<Incident> {
  public readonly auditService: AuditService;
  public readonly notificationsService: NotificationsService;

  constructor(
    prisma: PrismaService,
    logger: LoggerService,
    auditService: AuditService,
    notificationsService: NotificationsService,
  ) {
    super('Incident', logger, prisma);
    this.auditService = auditService;
    this.notificationsService = notificationsService;
  }

  protected getRepository() {
    return this.prisma.incident;
  }

  async create(dto: CreateIncidentDto, userId: string, isAdmin: boolean): Promise<Incident> {
    this.logger.log(`Creating incident for user: ${userId}`, 'IncidentsService');

    const isDraft = dto.isDraft ?? false;
    const status = isDraft ? Status.DRAFT : (dto.status || Status.OPEN);
    const assignedToId = isAdmin ? dto.assignedToId : userId;

    const existingDraft = await this.prisma.incident.findFirst({
      where: {
        userId,
        isDraft: true,
      },
    });

    let incident: Incident;

    if (existingDraft) {
      if (isDraft) {
        incident = await this.prisma.incident.update({
          where: { id: existingDraft.id },
          data: {
            title: dto.title,
            description: dto.description,
            severity: dto.severity,
            status,
            assignedToId,
          },
        });
        this.logger.log(`Updated existing draft: ${incident.id}`, 'IncidentsService');
      } else {
        incident = await this.prisma.incident.update({
          where: { id: existingDraft.id },
          data: {
            title: dto.title,
            description: dto.description,
            severity: dto.severity,
            status,
            isDraft: false,
            assignedToId,
          },
        });
        this.logger.log(`Converted draft to incident: ${incident.id}`, 'IncidentsService');
        
        await Promise.all([
          this.auditService.log('CREATED', incident.id, userId, null, incident),
          (async () => {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            await this.notificationsService.createForAdmin(
              'INCIDENT_CREATED',
              incident.id,
              incident.title,
              user?.email,
            );
          })(),
        ]);
      }
    } else {
      incident = await this.prisma.incident.create({
        data: {
          title: dto.title,
          description: dto.description,
          severity: dto.severity,
          status,
          isDraft,
          userId,
          assignedToId,
        },
      });
      this.logger.log(`Created incident: ${incident.id}`, 'IncidentsService');
      
      if (!isDraft) {
        await Promise.all([
          this.auditService.log('CREATED', incident.id, userId, null, incident),
          (async () => {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            await this.notificationsService.createForAdmin(
              'INCIDENT_CREATED',
              incident.id,
              incident.title,
              user?.email,
            );
          })(),
        ]);
      }
    }

    return incident;
  }

  async findAll(query: QueryIncidentsDto, userId: string, isAdmin: boolean) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.IncidentWhereInput = {};

    if (!isAdmin) {
      where.assignedToId = userId;
    } else if (query.userId) {
      where.OR = [
        { userId: query.userId },
        { assignedToId: query.userId },
      ];
    }

    if (query.severity) {
      where.severity = query.severity;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const searchTerm = query.search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    where.isDraft = false;

    const [data, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.incident.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Incident> {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    return incident;
  }

  async update(id: string, dto: UpdateIncidentDto, userId: string): Promise<Incident> {
    const existing = await this.findOne(id);

    const updateData: {
      title?: string;
      description?: string | null;
      severity?: Severity;
      status?: Status;
      isDraft?: boolean;
      assignedToId?: string | null;
    } = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.severity !== undefined) updateData.severity = dto.severity;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.isDraft !== undefined) updateData.isDraft = dto.isDraft;
    if (dto.assignedToId !== undefined) updateData.assignedToId = dto.assignedToId;

    if (dto.isDraft === false && existing.isDraft) {
      updateData.status = dto.status || Status.OPEN;
      updateData.isDraft = false;
    }

    if (Object.keys(updateData).length === 0) {
      return existing;
    }

    const updated = await this.prisma.incident.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.log('UPDATED', id, userId, existing, updated);

    if (dto.assignedToId && dto.assignedToId !== existing.assignedToId) {
      await this.notificationsService.createForUser(
        dto.assignedToId,
        'INCIDENT_ASSIGNED',
        id,
        updated.title,
      );
    }

    this.logger.log(`Updated incident: ${id}`, 'IncidentsService');

    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const incident = await this.findOne(id);

    await this.prisma.incident.delete({
      where: { id },
    });

    await this.auditService.log('DELETED', id, userId, incident, null);

    this.logger.log(`Deleted incident: ${id}`, 'IncidentsService');
  }

  async getDraft(userId: string): Promise<Incident | null> {
    return this.prisma.incident.findFirst({
      where: {
        userId,
        isDraft: true,
      },
    });
  }

  async deleteDraft(userId: string): Promise<void> {
    const draft = await this.getDraft(userId);
    if (draft) {
      await this.prisma.incident.delete({
        where: { id: draft.id },
      });
      this.logger.log(`Deleted draft: ${draft.id}`, 'IncidentsService');
    }
  }

  async autoSave(userId: string, dto: AutoSaveDto, isAdmin: boolean): Promise<Incident> {
    const existingDraft = await this.getDraft(userId);

    if (existingDraft) {
      const updateData: {
        title?: string;
        description?: string | null;
        severity?: Severity;
        assignedToId?: string | null;
      } = {};
      if (dto.title !== undefined) updateData.title = dto.title;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.severity !== undefined) updateData.severity = dto.severity;
      if (isAdmin && dto.assignedToId !== undefined) updateData.assignedToId = dto.assignedToId;

      if (Object.keys(updateData).length === 0) {
        return existingDraft;
      }

      const updated = await this.prisma.incident.update({
        where: { id: existingDraft.id },
        data: updateData,
      });

      this.logger.debug(`Auto-saved draft: ${updated.id}`, 'IncidentsService');
      return updated;
    } else {
      if (!dto.title || dto.title.trim().length === 0) {
        throw new BadRequestException('Title is required for creating a new draft');
      }

      const created = await this.prisma.incident.create({
        data: {
          title: dto.title.trim(),
          description: dto.description || null,
          severity: dto.severity || Severity.LOW,
          status: Status.DRAFT,
          isDraft: true,
          userId,
          assignedToId: isAdmin ? dto.assignedToId || null : userId,
        },
      });

      this.logger.debug(`Created new draft: ${created.id}`, 'IncidentsService');
      return created;
    }
  }

  async assign(id: string, dto: AssignIncidentDto, adminId: string): Promise<Incident> {
    const incident = await this.findOne(id);

    const updated = await this.prisma.incident.update({
      where: { id },
      data: {
        assignedToId: dto.assignedToId,
      },
    });

    await this.auditService.log('UPDATED', id, adminId, incident, updated);

    await this.notificationsService.createForUser(
      dto.assignedToId,
      'INCIDENT_ASSIGNED',
      id,
      updated.title,
    );

    this.logger.log(`Assigned incident ${id} to user ${dto.assignedToId}`, 'IncidentsService');

    return updated;
  }
}
