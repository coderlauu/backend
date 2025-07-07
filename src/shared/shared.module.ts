import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { HelperModule } from './helper/helper.module'
import { LoggerModule } from './logger/logger.module'
import { MailerModule } from './mailer/mailer.module'
import { RedisModule } from './redis/redis.module'

@Global()
@Module({
  imports: [
    // logger
    LoggerModule.forRoot(),
    RedisModule,
    HttpModule,
    HelperModule,
    MailerModule,
  ],
  exports: [RedisModule, HttpModule, HelperModule, MailerModule],
})
export class SharedModule {}
