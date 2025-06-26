import { Column, Entity, ManyToMany, Relation } from "typeorm";
import { CompleteEntity } from "~/common/entity/common.entity";
import { RoleEntity } from "../role/role.entity";


@Entity({ name: 'sys_menu' })
export class MenuEntity extends CompleteEntity {
    @Column({ type: 'tinyint', default: 0, comment: '菜单类型：0-目录，1-菜单，2-按钮' })
    type: number

    @Column()
    name: string

    @Column({ name: 'parent_id', nullable: true, comment: '上级节点' })
    parentId: number

    @Column({ nullable: true, comment: '路由地址' })
    path: string

    @Column({ nullable: true, default: '' })
    icon: string

    @Column({ type: 'int', nullable: true, default: 0, name: 'order_no' })
    orderNo: number

    @Column({ name: 'is_ext', type: 'boolean', default: false, comment: '是否外链' })
    isExt: boolean

    @Column({ type: 'tinyint', default: 1, comment: '在菜单中是否显示' })
    show: number

    @Column({ type: 'tinyint', default: 1, comment: '状态：1-启用，0-禁用' })
    status: number

    @Column({ nullable: true })
    permission: string

    @Column({ name: 'component', nullable: true, comment: '组件路径' })
    component: string

    @Column({ name: 'keep_alive', type: 'tinyint', default: 1, comment: '是否缓存' })
    keepAlive: number

    @Column({ name: 'active_menu', nullable: true, comment: '高亮菜单项' })
    activeMenu: string

    @Column({ name: 'ext_open_mode', type: 'tinyint', default: 1, comment: '外链打开方式：1-新窗口，2-当前窗口' })
    extOpenMode: number

    @ManyToMany(() => RoleEntity, role => role.menus)
    roles: Relation<RoleEntity[]>
}