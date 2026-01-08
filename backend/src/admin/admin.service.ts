import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../common/base/base.service';
import { LoggerService } from '../common/logger/logger.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { QueryAuditDto } from './dto/query-audit.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService extends BaseService<unknown> {
  public readonly usersService: UsersService;
  public readonly auditService: AuditService;

  constructor(
    prisma: PrismaService,
    logger: LoggerService,
    usersService: UsersService,
    auditService: AuditService,
  ) {
    super('Admin', logger, prisma);
    this.usersService = usersService;
    this.auditService = auditService;
  }

  protected getRepository() {
    return {
      findUnique: async () => Promise.resolve(null),
      findMany: async () => Promise.resolve([]),
      create: async () => Promise.resolve({} as unknown),
      update: async () => Promise.resolve({} as unknown),
      delete: async () => Promise.resolve({} as unknown),
    };
  }

  async createUser(dto: CreateUserDto) {
    return this.usersService.create(dto.email, dto.password, dto.role || 'USER');
  }

  async changeUserPassword(userId: string, dto: ChangePasswordDto) {
    await this.usersService.changePassword(userId, dto.newPassword);
  }

  async updateUserRole(userId: string, dto: UpdateUserRoleDto) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`User role updated: ${updated.email} -> ${updated.role}`, 'AdminService');

    return updated;
  }

  async getAllUsers(query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  async getAllAuditLogs(query: QueryAuditDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: { incidentId?: string; userId?: string } = {};

    if (query.incidentId) {
      where.incidentId = query.incidentId;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
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
          incident: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getAuditByIncidentId(incidentId: string) {
    return this.auditService.findByIncidentId(incidentId);
  }
}

