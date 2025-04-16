import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const timestamp = Date.now();

    this.logger.log(
      `Incoming Request: ${method} ${url} - Body: ${JSON.stringify(
        body
      )} - Query: ${JSON.stringify(query)} - Params: ${JSON.stringify(params)}`
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - timestamp;
          this.logger.log(
            `Response: ${method} ${url} - Status: 200 - Time: ${responseTime}ms`
          );
        },
        error: (error) => {
          const responseTime = Date.now() - timestamp;
          this.logger.error(
            `Error: ${method} ${url} - Status: ${error.status} - Time: ${responseTime}ms - Message: ${error.message}`
          );
        },
      })
    );
  }
}
