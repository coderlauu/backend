import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSource, LoggerOptions } from 'typeorm'
import { ConfigKeyPaths, dbKey, TDatabaseConfig } from '~/config'
import { env } from '~/global/env'
import { EntityExistConstraint } from './constraints/entity-exist.constraint'
import { UniqueConstraint } from './constraints/unique.constraint'

const providers = [EntityExistConstraint, UniqueConstraint]

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => {
        let loggerOptions: LoggerOptions = env('DB_LOGGING') as 'all'

        try {
          // 尝试解析 JSON 格式的日志配置
          loggerOptions = JSON.parse(loggerOptions) // 例：['error', 'warn']
        }
        catch (error) {
          // ignore
        }

        return {
          ...configService.get<TDatabaseConfig>(dbKey), // 基础数据库配置
          autoLoadEntities: true, // 自动加载实体类
          logging: loggerOptions, // 日志级别配置
        //   logger: new TypeORMLogger   // 自定义日志记录器
        }
      },
      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options).initialize()
        return dataSource
      },
    }),
  ],
  providers,
  exports: providers,
})
export class DatabaseModule {}
