import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";

import { FastifyReply, FastifyRequest } from 'fastify'
import { QueryFailedError } from "typeorm";
import { BusinessException } from "../exceptions/biz.exception";
import { isDev } from "~/global/env";
import { ErrorEnum } from "~/constants/error-code.constant";

interface myError {
    readonly status: number
    readonly message?: string
    readonly statusCode?: number
}

/** 全局异常过滤器 对于异常信息统一处理 【code, data: null, message】 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name)

    constructor() {
        this.registerCatchAllExceptionsHook()
    }

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const request = ctx.getRequest<FastifyRequest>()
        const response = ctx.getResponse<FastifyReply>()

        const url = request.raw.url!

        const status = this.getStatus(exception)
        let message = this.getErrorMessage(exception)

        // 系统内部错误时
        if (status === HttpStatus.INTERNAL_SERVER_ERROR && !(exception instanceof BusinessException)) {
            Logger.error(exception, undefined, 'Catch')

            if (!isDev) {
                message = ErrorEnum.SERVER_ERROR?.split(':')[1]
            }
        } else {
            this.logger.warn(
                `错误信息:::(${status}) ${message} Path: ${decodeURI(url)}`
            )
        }

        const apiErrorCode = exception instanceof BusinessException ? exception.getErrorCode() : status

        // 返回基础响应结果
        const resBody: IBaseResponse = {
            code: apiErrorCode,
            message,
            data: null
        }

        response.status(status).send(resBody)
    }

    getStatus(exception: unknown): number {
        if (exception instanceof HttpException) {
            return exception.getStatus()
        }
        else if (exception instanceof QueryFailedError) {
            return HttpStatus.INTERNAL_SERVER_ERROR
        }
        else {
            return (exception as myError)?.status ?? (exception as myError)?.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR
        }
    }

    getErrorMessage(exception: unknown): string {
        if (exception instanceof HttpException) {
            return exception.message
        }
        else if (exception instanceof QueryFailedError) {
            return exception.message
        }

        else {
            return (exception as any)?.response?.message ?? (exception as myError)?.message ?? `${exception}`
        }
    }

    registerCatchAllExceptionsHook() {
        process.on('unhandledRejection', (reason) => {
            console.error('Unhandled Rejection at:', reason)
        })

        process.on('uncaughtException', (err) => {
            console.error('Uncaught Exception:', err)
            process.exit(1)
        })
    }
}