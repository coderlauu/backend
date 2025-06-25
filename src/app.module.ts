import type { FastifyRequest } from 'fastify'

import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { ClsModule } from 'nestjs-cls'
import config from '~/config'
import { DatabaseModule } from './shared/database/database.module'
import { SharedModule } from './shared/shared.module'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor'
import { AllExceptionsFilter } from './common/filter/any-exception.filter'
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard'
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './module/user/user.module';
import { UserService } from './modules/user/user.service';
import { UserController } from './modules/user/user.controller';
import { UserModule } from './modules/user/user.module';

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
    UserModule,
  ],
  providers: [
    /** 全局异常过滤器 */
    { provide: APP_FILTER, useClass: AllExceptionsFilter },

    /** 全局响应拦截器，将所有 API 返回统一的数据格式【code、message、data】 */
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    /** 全局请求超时拦截器，超过10秒则抛出请求超时异常 */
    { provide: APP_INTERCEPTOR, useFactory: () => new TimeoutInterceptor(15 * 1000) },

    /**  */
    { provide: APP_GUARD, useClass: JwtAuthGuard },

    UserService
  ],
  controllers: [UserController]
})
export class AppModule {}
