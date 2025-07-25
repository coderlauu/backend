import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { UserModule } from '../user/user.module'
import { DeptModule } from './dept/dept.module'
import { DictItemModule } from './dict-item/dict-item.module'
import { DictTypeModule } from './dict-type/dict-type.module'
import { LogModule } from './log/log.module'
import { MenuModule } from './menu/menu.module'
import { ParamConfigModule } from './param-config/param-config.module'
import { RoleModule } from './role/role.module'

/**
 * 统一system目录下的所有模块
 */
const modules = [
  MenuModule,
  LogModule,
  ParamConfigModule,
  RoleModule,
  /** 用户模块---归类到system模块下，便于添加 /system 前缀 */
  UserModule,
  DeptModule,
  // 字典模块
  DictTypeModule,
  DictItemModule,
]

@Module({
  imports: [
    ...modules,
    RouterModule.register([
      {
        path: 'system',
        module: SystemModule,
        children: [...modules],
      },
    ]),
  ],
  exports: [...modules],
})
export class SystemModule {}
