import { Module } from '@nestjs/common'
import { LoggerModule } from './logger/logger.module'
import { RedisModule } from './redis/redis.module'

@Module({
  imports: [
    // logger
    LoggerModule.forRoot(),
    RedisModule,
  ],
  exports: [RedisModule],
})
export class SharedModule {}
