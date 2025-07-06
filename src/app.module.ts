import type { FastifyRequest } from 'fastify'

import { ClassSerializerInterceptor, Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ClsModule } from 'nestjs-cls'
import config from '~/config'
import { AllExceptionsFilter } from './common/filter/any-exception.filter'
import { IdempotenceInterceptor } from './common/interceptors/idempotence.interceptor'
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { AuthModule } from './modules/auth/auth.module'
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard'
import { SystemModule } from './modules/system/system.module'
import { DatabaseModule } from './shared/database/database.module'
import { SharedModule } from './shared/shared.module'
import { ToolsModule } from './modules/tools/tools.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      // 加载所有.env文件，优先级从左到右
      envFilePath: ['.env.local', `.env.${process.env.NODE_ENV}`, '.env'],
      load: [...Object.values(config)],
    }),
    /** 启用context上下文 */
    ClsModule.forRoot({
      global: true,
      interceptor: {
        mount: true,
        setup(cls, context) {
          const req = context.switchToHttp().getRequest<FastifyRequest<{ Params: { id?: string } }>>()
          if (req.params?.id && req.body) {
            // 供自定义参数验证器(UniqueConstraint)使用
            cls.set('operateId', Number.parseInt(req.params.id))
          }
        },
      },
    }),
    /** redis、mailer、helper */
    SharedModule,
    DatabaseModule,
    AuthModule,
    SystemModule,
    ToolsModule
  ],
  providers: [
    /**
     * 作用：捕获并处理所有未处理的异常
     * 功能：统一异常响应格式，记录错误日志
     * 效果：确保所有错误都有一致的响应结构
     * @description 全局过滤器
     */
    { provide: APP_FILTER, useClass: AllExceptionsFilter },

    /**
     * 作用：自动序列化响应对象
     * 功能：根据 DTO 类的装饰器（如 @Exclude, @Expose）过滤敏感字段
     * 效果：隐藏密码、token 等敏感信息
     * @description 类序列化拦截器
     */
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    /**
     * 作用：统一 API 响应格式【code、message、data】
     * 功能：包装所有响应为标准格式
     * 效果：统一响应结构，便于前端处理
     * @description 响应转换拦截器
     */
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    /**
     * 作用：设置请求超时时间
     * 功能：15 秒后自动取消长时间运行的请求
     * 效果：防止请求长时间挂起，提高系统稳定性
     * @description 请求超时拦截器
     */
    { provide: APP_INTERCEPTOR, useFactory: () => new TimeoutInterceptor(15 * 1000) },

    /**
     * 作用：防止重复请求
     * 功能：相同请求在短时间内只处理一次
     * 效果：避免用户重复点击导致的重复操作
     * @description 幂等性拦截器
     */
    { provide: APP_INTERCEPTOR, useClass: IdempotenceInterceptor },

    /**
     * 作用：验证用户身份
     * 功能：检查请求中的 JWT token 是否有效
     * 效果：未登录用户无法访问受保护的 API
     * @description JWT 身份验证守卫
     *
     * 🔄 工作流程图
     * 用户请求 → JwtAuthGuard (全局) → Passport.js → 查找 'jwt' 策略 → JwtStrategy.validate()
     * ↓
     * 如果验证成功 → 将用户信息注入到 request.user → 继续处理请求
     * 如果验证失败 → 抛出 UnauthorizedException → 返回 401 错误
     */
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}

/**
 * 执行顺序
 * 请求进入 → Guards → Interceptors (前) → Controller → Interceptors (后) → Filters → 响应
 */

/**
  1. ThrottlerGuard     → 检查请求频率
  2. JwtAuthGuard       → 验证用户身份
  3. RbacGuard          → 检查用户权限
  4. TimeoutInterceptor → 设置超时
  5. IdempotenceInterceptor → 检查重复请求
  6. Controller Method  → 执行业务逻辑
  7. ClassSerializerInterceptor → 序列化响应
  8. TransformInterceptor → 包装响应格式
  9. AllExceptionsFilter → 捕获异常（如果有）
 */
