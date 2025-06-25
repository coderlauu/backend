import type { Redis, RedisOptions } from 'ioredis'
import { Logger } from '@nestjs/common'
import IORedis from 'ioredis'

export class RedisSubPub {
  public pubClient: Redis
  public subClient: Redis
  constructor(private redisConfig: RedisOptions, private channelPrefix: string = 'm-admin-channel#') {
    this.init()
  }

  public init() {
    const redisOptions: RedisOptions = {
      host: this.redisConfig.host,
      port: this.redisConfig.port,
    }

    if (this.redisConfig.password) {
      redisOptions.password = this.redisConfig.password
    }

    const pubClient = new IORedis(redisOptions)
    const subClient = pubClient.duplicate()
    this.pubClient = pubClient
    this.subClient = subClient
  }

  public async publish(event: string, data: any) {
    const channel = `${this.channelPrefix}${event}`
    const _data = JSON.stringify(data)
    if (event !== 'log') {
      Logger.debug(`发布事件： ${channel} <- ${_data}`, RedisSubPub.name)
    }

    await this.pubClient.publish(channel, _data)
  }

  private ctx = new WeakMap<(data: any) => void, (channel: string, message: string) => void>()

  public async subscribe(event: string, callback: (data: any) => void) {
    const _channel = `${this.channelPrefix}${event}`
    this.subClient.subscribe(_channel)

    const cb = (channel, message) => {
      if (channel === _channel) {
        if (event !== 'log') {
          Logger.debug(`收到事件： ${channel} <- ${message}`, RedisSubPub.name)
        }
        callback(JSON.parse(message))
      }
    }

    this.ctx.set(callback, cb)
    this.subClient.on('message', cb)
  }

  public async unsubscribe(event: string, callback: (data: any) => void) {
    const channel = `${this.channelPrefix}${event}`
    // 取消订阅事件
    this.subClient.unsubscribe(channel)

    // 移除订阅函数
    const cb = this.ctx.get(callback)
    if (cb) {
      this.subClient.off('message', cb)
      this.ctx.delete(callback)
    }
  }
}
