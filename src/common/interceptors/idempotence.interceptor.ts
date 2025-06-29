import { CallHandler, ConflictException, ExecutionContext, Injectable, NestInterceptor, SetMetadata } from "@nestjs/common";
import { catchError, Observable, tap } from "rxjs";
import type { FastifyRequest } from "fastify";
import { Reflector } from "@nestjs/core";
import { HTTP_IDEMPOTENCE_KEY, HTTP_IDEMPOTENCE_OPTIONS } from "../decorators/idempotence.decorator";
import { CacheService } from "~/shared/redis/cache.service";
import { getIp } from "~/utils/ip.util";
import { getRedisKey, hashString } from "~/utils";

export const IdempotenceHeaderKey = 'x-idempotence-key'

export interface IdempotenceOption {
    errorMessage?: string
    pendingMessage?: string

    /** 如果有重复请求，手动处理异常 */
    handler?: (req: FastifyRequest) => any

    /** 
     * 记录重复请求的事件
     * @default 60 s
     */
    expired?: number

    /** 如果 header 没有幂等key，根据request生成 key */
    generateKey?: (req: FastifyRequest) => string

    /**
     * 仅读取 header 的key，不自动生成
     * @default false
     */
    disableGenerateKey?: boolean
}


/**
 *  1. 接收请求 → 2. 生成幂等性键 → 3. 检查 Redis   
                                      ↓   
                                  键不存在？   
                                 ↙        ↘   
                            是：设置为'0'    否：检查状态值   
                                ↓              ↙       ↘   
                            4. 执行业务逻辑    '0':处理中   '1':已完成   
                                ↓              ↓           ↓   
                            5a. 成功→设置'1'   返回409     返回409   
                            5b. 失败→删除键   
 */
@Injectable()
export class IdempotenceInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,          // 读取装饰器的元数据
        private readonly cacheService: CacheService, // Redis 缓存服务
    ) {}

    async intercept(context: ExecutionContext, next: CallHandler<any>) {
        const request = context.switchToHttp().getRequest<FastifyRequest>()

        // 跳过 Get 请求
        if (request.method.toUpperCase() === 'GET') {
            return next.handle()
        }

        const handler = context.getHandler()
        const options: IdempotenceOption | undefined = this.reflector.get(HTTP_IDEMPOTENCE_OPTIONS, handler)

        if (!options) {
            return next.handle()
        }

        const { 
            errorMessage = '请求重复，请稍后再试', 
            pendingMessage = '请求正在处理中，请稍后再试', 
            handler: errorHandler, 
            expired = 60, 
            disableGenerateKey = false 
        } = options

        const redis = this.cacheService.getClient()

        const idempotence = request.headers[IdempotenceHeaderKey] as string
        const key = disableGenerateKey ? undefined : options.generateKey ? options.generateKey(request) : this.generateKey(request)

        const idempotenceKey = !!(idempotence || key) && getRedisKey(`idempotence:${idempotence || key}`)
        // 将幂等性键值存储到请求处理器的元数据中。目的是让后续的代码可以通过 Reflector 从处理器中获取到这个幂等性键值，实现请求去重功能。
        SetMetadata(HTTP_IDEMPOTENCE_KEY, idempotence)(handler)

        if (idempotenceKey) {
            const resultValue: '0' | '1' | null = (await redis.get(idempotenceKey)) as any
            if (resultValue !== null) {
                if (errorHandler) {
                    return await errorHandler(request)
                }
                
                const message = {
                    1: errorMessage,
                    0: pendingMessage
                }[resultValue]

                throw new ConflictException(message)
            } else {
                await redis.set(idempotenceKey, '0', 'EX', expired)
            }
        }

        return next.handle().pipe(
            tap(async ()=> {
               if (idempotenceKey) {
                await redis.set(idempotenceKey, '1', 'KEEPTTL')
               }
            }),
            catchError(async (err) => {
                if (idempotenceKey) {
                    await redis.del(idempotenceKey)
                }
                throw err
            })
        )
    }

    private generateKey(req: FastifyRequest) {
        const { body, params, query = {}, headers, url } = req

        const obj = { body, params, url, query } as any

        const uuid = headers['x-uuid']
        if (uuid) {
            obj.uuid = uuid
        } else {
            const ua = headers['user-agent']
            const ip = getIp(req)

            if (!ua && !ip) {
                return undefined
            }

            Object.assign(obj, { ua, ip })
        } 
        
        return hashString(JSON.stringify(obj))
    }
}


/**
 * 🚀 实际使用示例：：：
 * 场景1：订单创建
    @Post('orders')
    @Idempotence({ 
        expired: 300,  // 5分钟防重复
        errorMessage: '订单已提交，请勿重复操作',
        generateKey: (req) => `order:${req.user.id}:${JSON.stringify(req.body)}`
    })
    async createOrder(@Body() dto: CreateOrderDto) {
        return this.orderService.create(dto)
    }

 * 场景2：支付处理
    @Post('payments')
    @Idempotence({ 
        expired: 600,  // 10分钟防重复
        disableGenerateKey: true,  // 必须提供 x-idempotence 头
        errorMessage: '支付请求已处理，请勿重复提交'
    })
    async processPayment(@Body() dto: PaymentDto) {
        return this.paymentService.process(dto)
    }
 */