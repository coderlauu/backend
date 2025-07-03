import { ApiHideProperty, ApiProperty } from '@nestjs/swagger'
import { Exclude } from 'class-transformer'
import dayjs from 'dayjs'
import { BaseEntity, Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, ValueTransformer, VirtualColumn } from 'typeorm'

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

  /** 自动设置为实体的插入日期 */
  @CreateDateColumn({ name: 'created_at', transformer })
  createdAt: Date

  /** 每次调用实体管理器或存储库的 save 时，它都会自动设置为实体的更新时间 */
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

  /**
   * 不会保存到数据库中的虚拟列，数据量大时可能会有性能问题，有性能要求请考虑在 service 层手动实现
   * @see https://typeorm.io/decorator-reference#virtualcolumn
   */
  @ApiProperty({ description: '创建者' })
  @VirtualColumn({ query: alias => `SELECT username FROM sys_user WHERE id = ${alias}.create_by` })
  creator: string

  @ApiProperty({ description: '更新者' })
  @VirtualColumn({ query: alias => `SELECT username FROM sys_user WHERE id = ${alias}.update_by` })
  updater: string
}
