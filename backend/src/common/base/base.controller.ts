import { LoggerService } from '../logger/logger.service';
import { ApiResponse } from '../interfaces/api-response.interface';

export abstract class BaseController {
  protected readonly logger: LoggerService;

  constructor(
    protected readonly serviceName: string,
    logger: LoggerService,
  ) {
    this.logger = logger;
  }

  protected handleResponse<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
    };
  }
}

