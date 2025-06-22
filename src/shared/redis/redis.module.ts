import { CacheModule } from '@nestjs/cache-manager'
import { Global, Module, Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { redisStore } from 'cache-manager-ioredis-yet'
import { RedisOptions } from 'ioredis'
import { ConfigKeyPaths } from '~/config'
import { redisKey, TRedisConfig } from '~/config/redis.config'
import { CacheService } from './cache.service'

const providers: Provider[] = [
  CacheService,
]

/**
 * 1、缓存存储
 * 2、数据存储
 * 3、发布订阅
 * 4、自定义服务
 */
@Global()
@Module({
  imports: [
    // imports = "让这个服务可用"
    // inject = 让 useFactory 可以接收到此服务
    CacheModule.registerAsync({
      // 将 ConfigService 模块导入到当前模块范围，让ConfigService在当前模块可用
      imports: [ConfigService],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => {
        const redisOptions: RedisOptions = configService.get<TRedisConfig>(redisKey as any)

        return {
          isGlobal: true,
          store: redisStore,
          isCacheableValue: () => true,
          ...redisOptions,
        }
      },
      // 告诉 Nestjs 在调用 useFactory 之前先实例化 ConfigService
      // inject 数组中的顺序对应 useFactory 函数参数的顺序
      inject: [ConfigService],
    }),
  ],
  providers,
  exports: [...providers, CacheModule],
})
export class RedisModule {}
