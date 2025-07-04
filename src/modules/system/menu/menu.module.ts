import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RoleModule } from '../role/role.module'
import { MenuController } from './menu.controller'
import { MenuEntity } from './menu.entity'
import { MenuService } from './menu.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([MenuEntity]),
    forwardRef(() => RoleModule),
  ],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [TypeOrmModule, MenuService],
})
export class MenuModule {}
