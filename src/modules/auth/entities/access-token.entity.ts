import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'

import { UserEntity } from '~/modules/user/user.entity'

import { RefreshTokenEntity } from './refresh-token.entity'

@Entity('user_access_tokens')
export class AccessTokenEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ length: 500 })
  value!: string

  @Column({ comment: '令牌过期时间' })
  expired_at!: Date

  @CreateDateColumn({ comment: '令牌创建时间' })
  created_at!: Date

  @OneToOne(() => RefreshTokenEntity, refreshToken => refreshToken.accessToken, {
    cascade: true,
  })
  refreshToken!: RefreshTokenEntity

  @ManyToOne(() => UserEntity, user => user.accessTokens, {
    onDelete: 'CASCADE', // 指定删除引用的对象时外键应如何表现 --"RESTRICT"|"CASCADE"|"SET NULL"
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity
}
