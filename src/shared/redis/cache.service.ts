import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { Emitter } from '@socket.io/redis-emitter'
import { Cache } from 'cache-manager'
import Redis from 'ioredis'
import { RedisIoAdapterKey } from '~/common/adapters/socket.adapter'
import { API_CACHE_PREFIX } from '~/constants/cache.constant'
import { getRedisKey } from '~/utils/redis.util'

export type TCacheKey = string
export type TCacheResult<T> = Promise<T | undefined>

/**
 * 对基础Redis进行封装
 * 1、简化缓存操作（get/set）
 * 2、底层Redis客户端访问
 * 3、Socket.IO 分布式消息发送
 * 4、缓存清理工具
 */
@Injectable()
export class CacheService {
  private cache!: Cache

  private ioRedis!: Redis
  constructor(@Inject(CACHE_MANAGER) cache: Cache) {
    this.cache = cache
  }

  /** redis客户端访问 */
  private get redisClient(): Redis {
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    return this.cache.store.client
  }

  public getClient() {
    return this.redisClient
  }

  /** 获取缓存 */
  public get<T>(key: TCacheKey): TCacheResult<T> {
    return this.cache.get(key)
  }

  /** 设置缓存 */
  public set<T>(key: TCacheKey, value: T, ms?: number) {
    return this.cache.set(key, value, ms)
  }

  /** Socket.IO 分布式消息发送 */
  private _emitter: Emitter

  /**
   * 为什么需要 Redis Emitter？？？
    集群环境下的问题
    Server 1: User A 连接
    Server 2: User B 连接
    Server 3: User C 连接
   
    如果 Server 1 想给 User B 发消息
    直接发送 ❌ : User B 不在 Server 1 上
    Redis Emitter ✅ : 通过 Redis 转发到 Server 2
   */
  public get emitter(): Emitter {
    if (!this._emitter) {
      this._emitter = new Emitter(this.redisClient, {
        key: RedisIoAdapterKey,
      })
    }

    return this._emitter
  }

  /** 缓存清理功能 */
  public async cleanCache() {
    const redis = this.getClient()
    const keys: string[] = await redis.keys(`${API_CACHE_PREFIX}*`)
    await Promise.all(keys.map(key => redis.del(key)))
  }

  public async cleanAllCache() {
    const redis = this.getClient()
    const keys: string[] = await redis.keys(getRedisKey('*'))
    await Promise.all(keys.map(key => redis.del(key)))
  }
}
