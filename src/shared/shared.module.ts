import { Global, Module } from '@nestjs/common'
import { LoggerModule } from './logger/logger.module'
import { RedisModule } from './redis/redis.module'
import { HelperModule } from './helper/helper.module'
import { HttpModule } from '@nestjs/axios'

@Global()
@Module({
  imports: [
    // logger
    LoggerModule.forRoot(),
    RedisModule,
    HttpModule,
    HelperModule
  ],
  exports: [RedisModule, HttpModule, HelperModule],
})
export class SharedModule {}
