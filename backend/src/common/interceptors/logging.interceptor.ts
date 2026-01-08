import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const user = request.user?.email || 'anonymous';
    const now = Date.now();

    this.logger.debug(
      `Incoming request: ${method} ${url} from user: ${user}`,
      'LoggingInterceptor',
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;
          this.logger.log(
            `Request completed: ${method} ${url} - ${responseTime}ms`,
            'LoggingInterceptor',
          );
        },
        error: (error: Error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `Request failed: ${method} ${url} - ${responseTime}ms`,
            error?.stack || error?.message || String(error),
            'LoggingInterceptor',
          );
        },
      }),
    );
  }
}

