import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { BaseGuard } from '../base/base.guard';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class RolesGuard extends BaseGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    logger: LoggerService,
  ) {
    super('RolesGuard', logger);
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const user = this.extractUser(context.switchToHttp().getRequest());

    if (!user) {
      this.logger.warn('RolesGuard: No user found in request', 'RolesGuard');
      return false;
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      this.logger.warn(
        `RolesGuard: User ${user.email} does not have required role. Required: ${requiredRoles.join(', ')}, Has: ${user.role}`,
        'RolesGuard',
      );
    }

    return hasRole;
  }
}

