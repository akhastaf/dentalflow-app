import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: FieldError[];
  timestamp: string;
  path: string;
}

export interface FieldError {
  field: string;
  message: string;
  value?: any;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: FieldError[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      if (Array.isArray(exceptionResponse.message)) {
        // Handle validation errors
        message = 'Validation failed';
        errors = this.formatValidationErrors(exceptionResponse.message);
      } else if (typeof exceptionResponse.message === 'string') {
        message = exceptionResponse.message;
      } else if (exceptionResponse.error) {
        message = exceptionResponse.error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse: ApiError = {
      statusCode: status,
      message,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  private formatValidationErrors(messages: string[]): FieldError[] {
    const errors: FieldError[] = [];

    messages.forEach((message) => {
      // Extract field name from validation message
      const fieldMatch = message.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
      const field = fieldMatch ? fieldMatch[1] : 'unknown';
      
      // Clean up the message by removing the field name prefix
      const cleanMessage = message.replace(/^[a-zA-Z_][a-zA-Z0-9_]*\.?/, '').trim();
      
      errors.push({
        field,
        message: cleanMessage || message,
      });
    });

    return errors;
  }
} 