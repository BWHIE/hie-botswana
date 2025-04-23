import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";
import { Response } from "express";

@Catch(HttpException)
export class FhirExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const error = exception.getResponse();

    response.status(status).json({
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "processing",
          details: {
            text: typeof error === "string" ? error : error["message"],
          },
        },
      ],
    });
  }
}
