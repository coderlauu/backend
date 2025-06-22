import type { Logger as WinstonLogger } from 'winston'

import { ConsoleLogger, ConsoleLoggerOptions, Injectable } from '@nestjs/common'
import { config, createLogger, format, transports } from 'winston'

import 'winston-daily-rotate-file'
import { ConfigService } from '@nestjs/config'
import { ConfigKeyPaths } from '~/config'

export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
    VERBOSE = 'verbose',
  }

@Injectable()
export class LoggerService extends ConsoleLogger {
  private winstonLogger: WinstonLogger

  constructor(context: string, options: ConsoleLoggerOptions, private configService: ConfigService<ConfigKeyPaths>) {
    super(context, options)

    this.initWinston()
  }

  protected get level(): LogLevel {
    return this.configService.get('app.logger.level', { infer: true }) as LogLevel
  }

  protected get maxFiles(): number {
    return this.configService.get('app.logger.maxFiles', { infer: true })
  }

  protected initWinston(): void {
    this.winstonLogger = createLogger({
      levels: config.npm.levels,
      format: format.combine(
        format.errors({ stack: true }),
        format.timestamp(),
        format.json(),
      ),
      transports: [
        new transports.DailyRotateFile({
            level: this.level,
            filename: 'logs/app.%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: this.maxFiles,
            format: format.combine(
                format.timestamp(),
                format.json(),
            ),
            auditFile: 'logs/.audit/app.json'
        }),
        new transports.DailyRotateFile({
          level: LogLevel.ERROR,
          filename: 'logs/app-error.%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: this.maxFiles,
          format: format.combine(
            format.timestamp(),
            format.json(),
          ),
          auditFile: 'logs/.audit/app-error.json'
        })
      ],
    })
  }

  verbose(message: unknown, context?: unknown, ...rest: unknown[]): void {
    // 调用父类verbose方法
    super.verbose.apply(this, [message, context, ...rest])
    // 同时使用 Winston 记录 VERBOSE 级别的日志到文件
    this.winstonLogger.verbose(LogLevel.VERBOSE, message, { context, ...rest })
  }

  debug(message: unknown, context?: unknown, ...rest: unknown[]): void {
    super.debug.apply(this, [message, context, ...rest])
    this.winstonLogger.debug(LogLevel.DEBUG, message, { context, ...rest })
  }

  log(message: any, context?: unknown, ...rest: unknown[]): void {  
    super.log.apply(this, [message, context, ...rest])
    this.winstonLogger.log(LogLevel.INFO, message, { context, ...rest })
  }

  warn(message: unknown, context?: unknown, ...rest: unknown[]): void {
    super.warn.apply(this, [message, context, ...rest])
    this.winstonLogger.warn(LogLevel.WARN, message, { context, ...rest })
  }

  error(message: any, stack?: string, context?: unknown, ...rest: unknown[]): void { 
    super.error.apply(this, [message, stack, context, ...rest])
    
    const hasStack = !!context
    this.winstonLogger.error(LogLevel.ERROR, { context: hasStack ? context : stack, message: hasStack ? new Error(message): message , ...rest })
  }

}
