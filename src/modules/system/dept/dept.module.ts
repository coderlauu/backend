import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from '~/modules/user/user.entity'
import { DeptController } from './dept.controller'
import { DeptEntity } from './dept.entity'
import { DeptService } from './dept.service'

@Module({
  imports: [TypeOrmModule.forFeature([DeptEntity, UserEntity])],
  controllers: [DeptController],
  providers: [DeptService],
})
export class DeptModule {}
