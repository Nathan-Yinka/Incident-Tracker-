import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseGuard } from '../../common/base/base.guard';
import { LoggerService } from '../../common/logger/logger.service';

@Injectable()
export class IncidentOwnershipGuard extends BaseGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    logger: LoggerService,
  ) {
    super('IncidentOwnershipGuard', logger);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = this.extractUser(request);
    const incidentId = request.params.id;

    if (!user) {
      this.logger.warn('IncidentOwnershipGuard: No user found in request', 'IncidentOwnershipGuard');
      throw new ForbiddenException('Access denied');
    }

    if (user.role === 'ADMIN') {
      return true;
    }

    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      select: { userId: true },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    if (incident.userId !== user.id) {
      this.logger.warn(
        `IncidentOwnershipGuard: User ${user.email} attempted to access incident ${incidentId} owned by ${incident.userId}`,
        'IncidentOwnershipGuard',
      );
      throw new ForbiddenException('You can only access your own incidents');
    }

    return true;
  }
}

