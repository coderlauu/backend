import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MenuModule } from '../menu/menu.module'
import { RoleController } from './role.controller'
import { RoleEntity } from './role.entity'
import { RoleService } from './role.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([RoleEntity]),

    forwardRef(() => MenuModule),
  ],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService, TypeOrmModule],
})
export class RoleModule {}
