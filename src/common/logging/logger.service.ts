import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggerService extends Logger {
  constructor() {
    super('AGRI');
  }

  logWithContext(message: string, context: string, meta?: any) {
    const metaStr = meta ? ` - ${JSON.stringify(meta)}` : '';
    this.log(`${message}${metaStr}`, context);
  }

  errorWithContext(message: string, context: string, error?: Error, meta?: any) {
    const metaStr = meta ? ` - ${JSON.stringify(meta)}` : '';
    this.error(`${message}${metaStr}`, error?.stack, context);
  }

  warnWithContext(message: string, context: string, meta?: any) {
    const metaStr = meta ? ` - ${JSON.stringify(meta)}` : '';
    this.warn(`${message}${metaStr}`, context);
  }
}
