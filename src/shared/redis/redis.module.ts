import { RedisModule as NestRedisModule, RedisService } from '@liaoliaots/nestjs-redis'
import { CacheModule } from '@nestjs/cache-manager'
import { Global, Module, Provider } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { redisStore } from 'cache-manager-ioredis-yet'
import { RedisOptions } from 'ioredis'
import { REDIS_CLIENT } from '~/common/decorators/inject-redis.decorator'
import { ConfigKeyPaths } from '~/config'
import { redisKey, TRedisConfig } from '~/config/redis.config'
import { CacheService } from './cache.service'
import { RedisSubPub } from './redis-subpub'
import { REDIS_PUBSUB } from './redis.constant'
import { SubPubService } from './subpub.service'

const providers: Provider[] = [
  CacheService,
  {
    provide: REDIS_CLIENT,
    useFactory: (redisService: RedisService) => {
      return redisService.getOrThrow()
    },
    inject: [RedisService],
  },
  // 业务层封装
  SubPubService,
  // 底层实例访问
  {
    provide: REDIS_PUBSUB,
    useFactory: (ConfigService: ConfigService<ConfigKeyPaths>) => {
      const redisOptions: RedisOptions = ConfigService.get<TRedisConfig>(redisKey as any)
      return new RedisSubPub(redisOptions)
    },
    inject: [ConfigService],
  },
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
      // 将 ConfigModule 模块导入到当前模块范围，让ConfigService在当前模块可用
      imports: [ConfigModule],
      // 告诉 Nestjs 在调用 useFactory 之前先实例化 ConfigService
      // inject 数组中的顺序对应 useFactory 函数参数的顺序
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => {
        const redisOptions: RedisOptions = configService.get<TRedisConfig>(redisKey as any)

        return {
          isGlobal: true,
          store: redisStore,
          isCacheableValue: () => true,
          ...redisOptions,
        }
      },
    }),
    NestRedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => ({
        readyLog: true,
        config: configService.get<TRedisConfig>(redisKey as any),
      }),
    }),
  ],
  providers,
  exports: [...providers, CacheModule],
})
export class RedisModule {}
