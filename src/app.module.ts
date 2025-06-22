import { Module } from '@nestjs/common'

import type { FastifyRequest } from 'fastify'

import { ConfigModule } from '@nestjs/config'
import config from '~/config'
import { DatabaseModule } from './shared/database/database.module'
import { SharedModule } from './shared/shared.module'
import { ClsModule } from 'nestjs-cls'

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
      }
    }),
    /** redis、mailer、helper */
    SharedModule,
    DatabaseModule,
  ],
})
export class AppModule {}
