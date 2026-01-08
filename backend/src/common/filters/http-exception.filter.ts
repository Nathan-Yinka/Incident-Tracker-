import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorMessages: string[] | string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        errorMessages = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        const responseMessage = responseObj.message;
        if (Array.isArray(responseMessage)) {
          message = responseMessage[0] || 'Validation failed';
          errorMessages = responseMessage;
        } else if (typeof responseMessage === 'string') {
          message = responseMessage;
          errorMessages = responseMessage;
        } else {
          // If message is not found, try to get a default message
          message = responseObj.error as string || message;
          errorMessages = message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
      errorMessages = exception.message;
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      data: null,
      message,
      error: {
        messages: errorMessages,
        statusCode: status,
      },
    };

    response.status(status).json(errorResponse);
  }
}
