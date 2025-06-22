import { CallHandler, ExecutionContext, Logger, NestInterceptor } from "@nestjs/common";

import { Observable, tap } from 'rxjs'

/**
 * @description 请求日志拦截器
 * 拦截所有请求，记录请求的详细信息，包括请求方法、请求路径、记录响应日志和耗时
 */
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name, { timestamp: false }) // 禁用时间戳（避免重复）

    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        const call$ = next.handle()
        const request = context.switchToHttp().getRequest()
        const content = `${request.method} -> ${request.url}`
        const isSse = request.headers.accept === 'text/event-stream'
        this.logger.debug(`+++ 请求： ${content}`)
        const now = Date.now()

        return call$.pipe(
            tap(() => {
                if (isSse) return

                // 记录响应日志和耗时
                this.logger.debug(`--- 响应： ${content} ${Date.now() - now}ms`)
            })
        )
    }
}