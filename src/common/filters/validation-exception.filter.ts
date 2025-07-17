import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

export interface FieldError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationErrorResponse {
  statusCode: number;
  message: string;
  errors: FieldError[];
  timestamp: string;
  path: string;
}

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    let errors: FieldError[] = [];
    let message = 'Validation failed';

    // Check if it's a validation error
    if (exception.getResponse() && typeof exception.getResponse() === 'object') {
      const exceptionResponse = exception.getResponse() as any;
      
      if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
        // Handle class-validator errors
        errors = this.formatValidationErrors(exceptionResponse.message);
        message = 'Validation failed';
      } else if (exceptionResponse.message) {
        // Handle single error message
        message = exceptionResponse.message;
        errors = [{
          field: 'general',
          message: exceptionResponse.message
        }];
      }
    }

    const errorResponse: ValidationErrorResponse = {
      statusCode: status,
      message,
      errors,
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
      
      errors.push({
        field,
        message: message.replace(/^[a-zA-Z_][a-zA-Z0-9_]*\.?/, '').trim(),
      });
    });

    return errors;
  }
} 