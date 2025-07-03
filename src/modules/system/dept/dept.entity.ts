import { ApiHideProperty, ApiProperty } from '@nestjs/swagger'
import { Column, Entity, JoinColumn, OneToMany, Relation, Tree, TreeChildren, TreeParent } from 'typeorm'
import { CompleteEntity } from '~/common/entity/common.entity'
import { UserEntity } from '~/modules/user/user.entity'

@Entity({ name: 'sys_dept' })
// @Tree('closure-table') // 封闭表-适合复杂查询、查询性能比较优；缺点：存储空间较大
@Tree('materialized-path')
export class DeptEntity extends CompleteEntity {
  @ApiProperty({ description: '部门名称' })
  @Column()
  name: string

  @Column({ nullable: true, default: 0, comment: '排序' })
  @ApiProperty({ description: '排序' })
  orderNo: number

  @TreeChildren({ cascade: true })
  children: DeptEntity[]

  @TreeParent({ onDelete: 'SET NULL' })
  parent?: DeptEntity

  @ApiHideProperty()
  @OneToMany(() => UserEntity, user => user.dept)
  users: Relation<UserEntity[]>
}
