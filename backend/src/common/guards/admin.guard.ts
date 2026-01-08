import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { BaseGuard } from '../base/base.guard';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class AdminGuard extends BaseGuard implements CanActivate {
  constructor(logger: LoggerService) {
    super('AdminGuard', logger);
  }

  canActivate(context: ExecutionContext): boolean {
    const user = this.extractUser(context.switchToHttp().getRequest());

    if (!user) {
      this.logger.warn('AdminGuard: No user found in request', 'AdminGuard');
      throw new ForbiddenException('Access denied');
    }

    if (user.role !== 'ADMIN') {
      this.logger.warn(
        `AdminGuard: User ${user.email} attempted to access admin resource`,
        'AdminGuard',
      );
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}


