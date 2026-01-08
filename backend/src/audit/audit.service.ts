import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../common/base/base.service';
import { LoggerService } from '../common/logger/logger.service';
import { AuditLog } from '@prisma/client';

@Injectable()
export class AuditService extends BaseService<AuditLog> {
  constructor(
    prisma: PrismaService,
    logger: LoggerService,
  ) {
    super('AuditLog', logger, prisma);
  }

  protected getRepository() {
    return this.prisma.auditLog;
  }

  async log(
    action: string,
    incidentId: string,
    userId: string,
    oldValue: unknown,
    newValue: unknown,
  ): Promise<AuditLog> {
    this.logger.debug(
      `Creating audit log: ${action} for incident ${incidentId} by user ${userId}`,
      'AuditService',
    );

    return this.prisma.auditLog.create({
      data: {
        action,
        incidentId,
        userId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      },
    });
  }

  async findByIncidentId(incidentId: string): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }
}

