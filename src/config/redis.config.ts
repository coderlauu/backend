import { ConfigType, registerAs } from '@nestjs/config'
import { env, envOfNumber } from '~/global/env'

export const redisKey = 'redis'

export const RedisConfig = registerAs(redisKey, () => ({
  host: env('REDIS_HOST', '127.0.0.1'),
  port: envOfNumber('REDIS_PORT', 6379),
  password: env('REDIS_PASSWORD'),
  db: envOfNumber('REDIS_DB', 0),
  prefix: env('REDIS_PREFIX', 'm-admin'),
}))

export type TRedisConfig = ConfigType<typeof RedisConfig>
