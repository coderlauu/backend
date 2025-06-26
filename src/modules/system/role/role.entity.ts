import { ApiHideProperty, ApiProperty } from '@nestjs/swagger'
import { Column, Entity, JoinTable, ManyToMany, Relation } from 'typeorm'
import { CompleteEntity } from '~/common/entity/common.entity'
import { MenuEntity } from '~/modules/system/menu/menu.entity'
import { UserEntity } from '~/modules/user/user.entity'

@Entity({ name: 'sys_role' })
export class RoleEntity extends CompleteEntity {
  @Column({ length: 50, unique: true })
  @ApiProperty({ description: '角色名称' })
  name: string

  @Column({ unique: true, comment: '角色标识' })
  @ApiProperty({ description: '角色标识' })
  value: string

  @Column({ nullable: true })
  @ApiProperty({ description: '角色描述' })
  remark: string

  @Column({ type: 'tinyint', default: 1, nullable: true })
  @ApiProperty({ description: '状态：1-启用，0-禁用' })
  status: number

  @Column({ nullable: true })
  @ApiProperty({ description: '是否默认用户' })
  default: boolean

  @ApiHideProperty()
  @ManyToMany(() => UserEntity, user => user.roles)
  users: Relation<UserEntity[]>

  @ApiHideProperty()
  @ManyToMany(() => MenuEntity, menu => menu.roles)
  @JoinTable({
    name: 'sys_role_menus', // 中间表的名称
    joinColumn: {
      name: 'role_id', // 中间表的 role_id 字段
      referencedColumnName: 'id', // 引用 Role 表的 id 字段
    },
    inverseJoinColumn: {
      name: 'menu_id', // 中间表的 menu_id 字段
      referencedColumnName: 'id', // 引用 Menu 表的 id 字段
    },
  })
  menus: Relation<MenuEntity[]>
}
