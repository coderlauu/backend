import { Exclude } from 'class-transformer'
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, Relation } from 'typeorm'
import { CommonEntity } from '~/common/entity/common.entity'
import { DeptEntity } from '~/modules/system/dept/dept.entity'
import { RoleEntity } from '~/modules/system/role/role.entity'
import { AccessTokenEntity } from '../auth/entities/access-token.entity'

@Entity('sys_user')
export class UserEntity extends CommonEntity {
  @Column({ length: 50 })
  username!: string

  @Exclude() /** @Exclude() 需要序列化处理：class-transformer 的装饰器需要通过序列化才能生效 */
  @Column({ length: 50 })
  password!: string

  @Column({ length: 32 })
  psalt: string

  @Column({ nullable: true })
  nickname: string

  @Column({ name: 'avatar', nullable: true })
  avatar: string

  @Column({ nullable: true })
  qq: string

  @Column({ nullable: true })
  phone: string

  @Column({ nullable: true })
  email: string

  @Column({ nullable: true })
  remark: string

  @Column({ type: 'tinyint', default: 1, nullable: true })
  status: number

  @ManyToMany(() => RoleEntity, role => role.users)
  @JoinTable({
    name: 'sys_user_roles',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
  }) // 中间表
  roles: Relation<RoleEntity[]>

  @ManyToOne(() => DeptEntity, dept => dept.users)
  @JoinColumn({ name: 'dept_id' })
  dept: Relation<DeptEntity>

  @OneToMany(() => AccessTokenEntity, accessToken => accessToken.user, {
    cascade: true,
  })
  accessTokens!: Relation<AccessTokenEntity[]>
}
