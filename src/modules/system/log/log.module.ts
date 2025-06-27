import { Logger, Module } from '@nestjs/common';
import { LogController } from './log.controller';
import { LoginLogService } from './services/login-log.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginLogEntity } from './entities/login-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoginLogEntity])
  ],
  controllers: [LogController],
  providers: [LoginLogService], // 👈 "我负责管理这个服务"
  exports: [LoginLogService, TypeOrmModule] // 👈 "我把我管理的服务分享给别人"
})
export class LogModule {}
