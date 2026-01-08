import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';

const { PrismaClient } = require('@prisma/client');

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly logger: LoggerService) {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected (PostgreSQL)', 'PrismaService');
    } catch (error) {
      this.logger.error('Failed to connect to database', (error as Error).stack, 'PrismaService');
      throw error;
    }

    this.$on('error', (event: { message: string; target?: string }) => {
      this.logger.error(`Database error: ${event.message}`, JSON.stringify(event), 'PrismaService');
    });
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Database disconnected', 'PrismaService');
    } catch (error) {
      this.logger.error('Error disconnecting from database', (error as Error).stack, 'PrismaService');
    }
  }
}

