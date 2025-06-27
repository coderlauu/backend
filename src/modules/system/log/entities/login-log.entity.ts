import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, JoinColumn, ManyToOne, Relation } from "typeorm";
import { CommonEntity } from "~/common/entity/common.entity";
import { UserEntity } from "~/modules/user/user.entity";



/**
 * 登录日志
 * 一个用户会存在多个登录记录 -> 一对多
 */
@Entity({ name: 'sys_login_log' })
export class LoginLogEntity extends CommonEntity {
    @Column({ nullable: true })
    @ApiProperty({ description: 'IP' })
    ip: string

    @Column({ nullable: true })
    @ApiProperty({ description: 'IP地址' })
    address: string

    @Column({ nullable: true })
    @ApiProperty({ description: '登录方式' })
    provider: string

    @Column({ nullable: true, length: 50 })
    @ApiProperty({ description: '浏览器ua' })
    ua: string

    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' }) //  当用户被删除时，自动删除该用户的所有登录日志
    @JoinColumn({ name: 'user_id' }) // 使用user_id存储用户id
    user: Relation<UserEntity>
}