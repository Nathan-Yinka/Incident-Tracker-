import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../common/base/base.service';
import { LoggerService } from '../common/logger/logger.service';
import { Notification, NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService extends BaseService<Notification> {
  constructor(
    prisma: PrismaService,
    logger: LoggerService,
  ) {
    super('Notification', logger, prisma);
  }

  protected getRepository() {
    return this.prisma.notification;
  }

  async create(
    userId: string,
    type: NotificationType,
    message: string,
    incidentId?: string,
  ): Promise<Notification> {
    this.logger.debug(`Creating notification for user: ${userId}`, 'NotificationsService');

    return this.prisma.notification.create({
      data: {
        userId,
        type,
        message,
        incidentId,
      },
    });
  }

  async createForAdmin(
    type: NotificationType,
    incidentId: string,
    incidentTitle?: string,
    creatorEmail?: string,
  ): Promise<void> {
    const admin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!admin) {
      this.logger.warn('No admin user found for notification', 'NotificationsService');
      return;
    }

    let message = '';
    if (type === 'INCIDENT_CREATED') {
      message = `New incident '${incidentTitle || 'Untitled'}' created by ${creatorEmail || 'a user'}`;
    } else if (type === 'INCIDENT_UPDATED') {
      message = `Incident '${incidentTitle || 'Untitled'}' has been updated`;
    }

    await this.create(admin.id, type, message, incidentId);
  }

  async createForUser(
    userId: string,
    type: NotificationType,
    incidentId: string,
    incidentTitle?: string,
  ): Promise<void> {
    let message = '';
    if (type === 'INCIDENT_ASSIGNED') {
      message = `Incident '${incidentTitle || 'Untitled'}' has been assigned to you`;
    } else if (type === 'INCIDENT_UPDATED') {
      message = `Incident '${incidentTitle || 'Untitled'}' has been updated`;
    }

    await this.create(userId, type, message, incidentId);
  }

  async findAll(userId: string, query: { page?: number; limit?: number; isRead?: boolean }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: { userId: string; isRead?: boolean } = { userId };

    if (query.isRead !== undefined) {
      where.isRead = query.isRead;
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isRead: 'asc' },
          { createdAt: 'desc' },
        ],
        include: {
          incident: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return {
      data,
      total,
      page,
      limit,
      unreadCount,
    };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

