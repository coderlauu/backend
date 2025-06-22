import { RedisConfig } from '~/config/redis.config'
import { RedisKeys } from '~/constants/cache.constant'

// 获取配置
function getPrefix() {
  return RedisConfig().prefix
}

const prefix = getPrefix()
type Prefix = typeof prefix

/**
 * @description 命名空间隔离，避免 key 冲突
  Redis 中可能有多个应用的数据：
  - m-admin:user:123        # 你的应用
  - other-app:user:123     # 其他应用
  - blog:user:123          # 博客应用
 */
export function getRedisKey<T extends string = RedisKeys | '*'>(key: T, ...concatKeys: string[]): `${Prefix}:${T}${string | ''}` {
  return `${prefix}:${key}${
    concatKeys && concatKeys.length ? `:${concatKeys.join('_')}` : ''
  }`
}
