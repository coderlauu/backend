import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { map } from 'rxjs/operators'
import { BYPASS_KEY } from "../decorators/bypass.decorator";
import type { FastifyRequest } from 'fastify'
import qs from "qs";
import { ResOp } from "../model/response.model";

/**
 * @description 让所有 API 返回统一的数据格式【code、message、data】
 * @ByPass() 跳过包装
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
    constructor(private readonly reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        const byPass = this.reflector.get<boolean>(
            BYPASS_KEY,
            context.getHandler()
        )

        if (byPass) {
            return next.handle()
        }

        const http = context.switchToHttp()
        const request = http.getRequest<FastifyRequest>()

        // 处理 query 参数，将数组参数转换为数组,如：?a[]=1&a[]=2 => { a: [1, 2] }
        request.query = qs.parse(request.url.split('?').at(1))

        return next.handle().pipe(
            map((data) => (new ResOp(HttpStatus.OK, data ?? null)))
        )
    }
}