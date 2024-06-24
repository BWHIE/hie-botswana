import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

export interface FhirOperationOutcome {
  resourceType: 'OperationOutcome';
  issue: {
    severity: 'fatal' | 'error' | 'warning' | 'information';
    code: string;
    diagnostics: string;
  }[];
}

@Catch(HttpException)
export class FhirExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const outcome: FhirOperationOutcome = {
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: status === HttpStatus.BAD_REQUEST ? 'invalid' : 'exception',
          diagnostics:
            exception.getResponse()['message'] || 'Unexpected error occurred',
        },
      ],
    };

    response.status(status).json(outcome);
  }
}
