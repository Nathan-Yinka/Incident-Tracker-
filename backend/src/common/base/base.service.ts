import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export abstract class BaseService<T> implements OnModuleDestroy {
  protected readonly logger: LoggerService;
  protected readonly prisma: PrismaService;

  constructor(
    protected readonly modelName: string,
    logger: LoggerService,
    prisma: PrismaService,
  ) {
    this.logger = logger;
    this.prisma = prisma;
  }

  protected abstract getRepository(): {
    findUnique: (args: { where: { id: string } }) => Promise<T | null>;
    findMany: (args?: unknown) => Promise<T[]>;
    create: (args: { data: unknown }) => Promise<T>;
    update: (args: { where: { id: string }; data: unknown }) => Promise<T>;
    delete: (args: { where: { id: string } }) => Promise<T>;
  };

  async findById(id: string): Promise<T | null> {
    this.logger.debug(`Finding ${this.modelName} by id: ${id}`, this.constructor.name);
    try {
      return await this.getRepository().findUnique({ where: { id } });
    } catch (error) {
      this.handleError(error as Error, `Failed to find ${this.modelName} by id`);
    }
  }

  protected handleError(error: Error, context: string): never {
    this.logger.error(`${context}: ${error.message}`, error.stack, this.constructor.name);
    throw error;
  }

  onModuleDestroy() {
    this.logger.debug(`${this.modelName} service destroyed`, this.constructor.name);
  }
}

