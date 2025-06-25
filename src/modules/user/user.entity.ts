import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { AccessTokenEntity } from '../auth/entities/access-token.entity'

@Entity('sys_user')
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ length: 50 })
  username!: string

  @Column({ length: 50 })
  password!: string

  @Column()
  accessTokens!: AccessTokenEntity
}
