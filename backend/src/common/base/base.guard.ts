import { CanActivate, ExecutionContext } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { CurrentUser } from '../types/user.types';

export abstract class BaseGuard implements CanActivate {
  protected readonly logger: LoggerService;

  constructor(
    protected readonly guardName: string,
    logger: LoggerService,
  ) {
    this.logger = logger;
  }

  abstract canActivate(context: ExecutionContext): boolean | Promise<boolean>;

  protected extractUser(request: { user?: CurrentUser }): CurrentUser | null {
    return request.user || null;
  }
}

