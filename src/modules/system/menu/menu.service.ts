import { Injectable } from '@nestjs/common';
import { RoleService } from '../role/role.service';
import { isEmpty, uniq } from 'lodash';
import { generatorRouters } from '~/utils/permission.util';
import { MenuEntity } from './menu.entity';
import { In, IsNull, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class MenuService {
    constructor(
        private readonly roleService: RoleService,
        @InjectRepository(MenuEntity) private readonly menuRepository: Repository<MenuEntity>
    ) {}


    /**
     * 获取用户菜单
     * @param uid 用户id
     * @returns 菜单列表
     */
    async getMenus(uid: number) {
        // 1、先获取该用户所拥有的角色ids
        const roleIds = await this.roleService.getRoleIdsByUser(uid)

        // 3、如果用户没有角色，则返回空数组
        if (isEmpty(roleIds)) {
            return generatorRouters([])
        }

        // 2、如果用户是超级管理员，则获取所有菜单
        if (this.roleService.hasAdminRole(roleIds)) {
            const menus = await this.menuRepository.find({ order: { orderNo: 'ASC' } })
            return generatorRouters(menus)
        }
        // 4、如果用户不是超级管理员，则获取用户所拥有的菜单
        else {
            const menus = await this.menuRepository
                .createQueryBuilder('menu')
                .innerJoinAndSelect('menu.roles', 'role')
                .andWhere('role.id In (:...roleIds)', { roleIds })
                .orderBy('menu.order_no', 'ASC')
                .getMany()

            return generatorRouters(menus)
        }
    }

    /**
     * 获取用户权限
     * @param uid 用户id
     * @returns 权限列表
     */
    async getPermissions(uid: number): Promise<string[]> {
        const roleIds = await this.roleService.getRoleIdsByUser(uid)
        let permissions: any[] = []
        let result: any = null

        if (this.roleService.hasAdminRole(roleIds)) {
            result = await this.menuRepository.findBy({
                permission: Not(IsNull()),    // 权限字段不为空
                type: In([1, 2]),            // 只查询菜单和权限类型（不包括目录）
            })
        }
        else {
            if (isEmpty(roleIds)) {
                return permissions
            }

            result = await this.menuRepository
                .createQueryBuilder('menu')
                .innerJoinAndSelect('menu.roles', 'role')           // 关联角色表 -- 'menu.roles' 是 MenuEntity.roles 属性 -- role是连接后 RoleEntity 的别名
                .andWhere('role.id IN (:...roleIds)', { roleIds })  // 角色ID匹配
                .andWhere('menu.type IN (1,2)')                     // 菜单和权限类型
                .andWhere('menu.permission IS NOT NULL')            // 权限字段不为空
                .getMany()
        }
        if (!isEmpty(result)) {
            result.forEach(menu => {
                if (menu.permission) {
                    permissions = [...permissions, ...menu.permission.split(',')]
                }
            })
            permissions = uniq(permissions)
        }
        return permissions
    }   
}
