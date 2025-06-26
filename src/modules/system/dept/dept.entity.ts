import { ApiHideProperty, ApiProperty } from '@nestjs/swagger'
import { Column, Entity, OneToMany, Relation, TreeChildren, TreeParent } from 'typeorm'
import { CompleteEntity } from '~/common/entity/common.entity'
import { UserEntity } from '~/modules/user/user.entity'

@Entity({ name: 'sys_dept' })
export class DeptEntity extends CompleteEntity {
  @ApiProperty({ description: '部门名称' })
  @Column({ length: 50, unique: true })
  name: string

  @ApiProperty({ description: '部门标识' })
  @Column({ unique: true, comment: '部门标识' })
  value: string

  @Column({ nullable: true, default: 0, comment: '排序' })
  @ApiProperty({ description: '排序' })
  orderNo: number

  @TreeChildren({ cascade: true })
  children: DeptEntity[]

  @TreeParent({ onDelete: 'SET NULL' })
  parent: DeptEntity

  @ApiHideProperty()
  @OneToMany(() => UserEntity, user => user.dept)
  users: Relation<UserEntity[]>
}
