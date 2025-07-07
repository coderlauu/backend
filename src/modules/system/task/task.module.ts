import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigKeyPaths, redisKey, TRedisConfig } from '~/config'
import { SYS_TASK_QUEUE_NAME, SYS_TASK_QUEUE_PREFIX } from './constant'
import { TaskController } from './task.controller'
import { TaskEntity } from './task.entity'
import { TaskService } from './task.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskEntity]),
    BullModule.registerQueueAsync({
      name: SYS_TASK_QUEUE_NAME,
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => {
        return {
          redis: configService.get<TRedisConfig>(redisKey),
          prefix: SYS_TASK_QUEUE_PREFIX,
        }
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TypeOrmModule, TaskService],
})
export class TaskModule {}
