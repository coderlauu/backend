import { ApiHideProperty } from '@nestjs/swagger'
import { Exclude } from 'class-transformer'
import dayjs from 'dayjs'
import { BaseEntity, Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, ValueTransformer } from 'typeorm'

/**
 * 时间戳转换
 */
const transformer: ValueTransformer = {
  to(value) {
    return value
  },
  from(value) {
    return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
  },
}

export abstract class CommonEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @CreateDateColumn({ name: 'created_at', transformer })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', transformer })
  updatedAt: Date
}

export abstract class CompleteEntity extends CommonEntity {
  @ApiHideProperty()
  @Exclude()
  @Column({ name: 'create_by', update: false, comment: '创建者', nullable: true })
  createBy: number

  @ApiHideProperty()
  @Exclude()
  @Column({ name: 'update_by', comment: '更新者', nullable: true })
  updateBy: number
}
