import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  Logger,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const duration = Date.now() - startTime;

        const logMessage = `[${method}] ${url} - ${statusCode} - ${duration}ms`;

        if (statusCode >= 500) {
          this.logger.error(logMessage);
        } else if (statusCode >= 400) {
          this.logger.warn(logMessage);
        } else {
          this.logger.log(logMessage);
        }
      }),
    );
  }
}
