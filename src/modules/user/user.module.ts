import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ParamConfigModule } from '../system/param-config/param-config.module'
import { RoleModule } from '../system/role/role.module'
import { UserController } from './user.controller'
import { UserEntity } from './user.entity'
import { UserService } from './user.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    RoleModule,
    ParamConfigModule,
  ],
  controllers: [UserController],
  providers: [UserService], // 服务提供者（只在本模块内可用）
  exports: [TypeOrmModule, UserService], // 导出给其他模块使用【如AuthModule】
})
export class UserModule {}
