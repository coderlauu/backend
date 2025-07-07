import type { MenuTreeNode } from '~/utils/permission.util'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import Redis from 'ioredis'
import { isEmpty, uniq } from 'lodash'
import { In, IsNull, Like, Not, Repository } from 'typeorm'
import { InjectRedis } from '~/common/decorators/inject-redis.decorator'
import { RedisKeys } from '~/constants/cache.constant'
import { genAuthPermKey, genAuthTokenKey } from '~/helper/genRedisKey'
import { deleteEmptyChildren } from '~/utils/list2tree.util'

import { generatorMenu, generatorRouters } from '~/utils/permission.util'
import { RoleService } from '../role/role.service'
import { MenuDto, MenuQueryDto } from './menu.dto'
import { MenuEntity } from './menu.entity'
import { BusinessException } from '~/common/exceptions/biz.exception'
import { ErrorEnum } from '~/constants/error-code.constant'

@Injectable()
export class MenuService {
  constructor(
    private readonly roleService: RoleService,
        @InjectRepository(MenuEntity) private readonly menuRepository: Repository<MenuEntity>,
        @InjectRedis() private readonly redis: Redis,
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

    const isAdmin = this.roleService.hasAdminRole(roleIds)
    if (isAdmin) {
      const menus = await this.menuRepository.find({ order: { orderNo: 'ASC' } })
      
      return generatorRouters(menus)
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
        permission: Not(IsNull()), // 权限字段不为空
        type: In([1, 2]), // 只查询菜单和权限类型（不包括目录）
      })
    }
    else {
      if (isEmpty(roleIds)) {
        return permissions
      }

      result = await this.menuRepository
        .createQueryBuilder('menu')
        .innerJoinAndSelect('menu.roles', 'role') // 关联角色表 -- 'menu.roles' 是 MenuEntity.roles 属性 -- role是连接后 RoleEntity 的别名
        .andWhere('role.id IN (:...roleIds)', { roleIds }) // 角色ID匹配
        .andWhere('menu.type IN (1,2)') // 菜单和权限类型
        .andWhere('menu.permission IS NOT NULL') // 权限字段不为空
        .getMany()
    }
    if (!isEmpty(result)) {
      result.forEach((menu) => {
        if (menu.permission) {
          permissions = [...permissions, ...menu.permission.split(',')]
        }
      })
      permissions = uniq(permissions)
    }
    return permissions
  }

  /**
   * 刷新所有在线用户的权限
   * @param isNoticeUser 是否通知用户
   */
  async refreshAllOnlineUserPermissions(isNoticeUser = true): Promise<void> {
    const onlineUserIds = await this.redis.keys(genAuthTokenKey('*'))
    if (!isEmpty(onlineUserIds)) {
      const promises = onlineUserIds.map(token => Number.parseInt(token.split(RedisKeys.AUTH_TOKEN_PREFIX)[1])).filter(Boolean).map(async (userId) => {
        // 重新获取用户的最新权限
        const perms = await this.getPermissions(userId)
        // 重新写入redis
        /**
         *  [
                "system:user:list",
                "system:role:list",
                ...
            ]
         */
        await this.redis.set(genAuthPermKey(userId), JSON.stringify(perms))
        return userId
      })
      const userIds = await Promise.all(promises)
      if (isNoticeUser) {
        // todo 通知用户
      }
    }
  }

  /**
   * 获取菜单列表
   * @param dto 查询条件
   * @returns 菜单树形结构
   */
  async list(dto: MenuQueryDto): Promise<MenuTreeNode[]> {
    const { name, component, path, permission, status } = dto
    const menus = await this.menuRepository.find({
      where: {
        ...(name && { name: Like(`%${name}%`) }),
        ...(component && { component: Like(`%${component}%`) }),
        ...(path && { path: Like(`%${path}%`) }),
        ...(permission && { permission: Like(`%${permission}%`) }),
        ...(status && { status }),
      },
      order: {
        orderNo: 'ASC',
      },
    })

    const menuTree = generatorMenu(menus)
    console.log('menuTree', menuTree)
    if (!isEmpty(menuTree)) {
      deleteEmptyChildren(menuTree)
      return menuTree
    }

    // 如果生产树形结构为空，则返回原始菜单列表
    return menuTree
  }

  /**
   * 获取菜单详情以及关联的父菜单信息
   * @param id 菜单id
   * @returns 菜单详情
   */
  async detail(id: number): Promise<MenuTreeNode & { parentMenu: MenuEntity }> {
    const menu = await this.menuRepository.findOneBy({ id })
    let parentMenu: MenuEntity | undefined

    if (!menu) {
      throw new NotFoundException('菜单不存在')
    }

    if (menu.parentId) {
      parentMenu = await this.menuRepository.findOneBy({ id: menu.parentId })
    }

    return {
      ...menu,
      parentMenu,
    }
  }

  /**
   * 检查菜单或权限
   * @param dto 菜单或权限信息
   */
  async check(dto: Partial<MenuDto>): Promise<void | never> {
    // 权限类型不能没有父级id
    if (dto.type === 2 && !dto.parentId) {
      throw new BusinessException(ErrorEnum.PERMISSION_REQUIRES_PARENT)
    }
    /**
     * 目录类型 上级菜单可以为目录
     * 菜单类型 如果有父级菜单
     * 1、检查父菜单不能为空
     * 2、检查上级菜单不能为菜单类型！！！
     */
    if (dto.type === 1 && dto.parentId) {
      // 获取他的父级菜单
      const parentMenu = await this.getMenuItemInfo(dto.parentId)
      console.log('parentMenu', parentMenu);
      
      if (isEmpty(parentMenu)) {
        throw new BusinessException(ErrorEnum.PARENT_MENU_NOT_FOUND)
      }

      // 检查上级菜单不能为 非目录类型！！！
      if (parentMenu.type === 1 || parentMenu.type === 2) {
        throw new BusinessException(ErrorEnum.ILLEGAL_OPERATION_DIRECTORY_PARENT)
      }
    }
  }

  async getMenuItemInfo(menuId: number): Promise<MenuEntity> {
    const menu = await this.menuRepository.findOneBy({ id: menuId })
    return menu
  }

  /**
   * 新增菜单或权限
   * @param menu 菜单或权限信息
   */
  async create(menu: MenuDto): Promise<void> {
    const result = await this.menuRepository.save(menu)
    console.log('result', result);
    // TODO: 通过menuIds通知用户更新权限菜单
    // this.sseService.noticeClientToUpdateMenusByMenuIds([result.id])
  }

  /**
   * 更新菜单或权限
   * @param id 菜单id
   * @param menu 菜单或权限信息
   */
  async update(id: number, menu: MenuQueryDto): Promise<void> {
    await this.menuRepository.update(id, menu)
    // TODO: 通过menuIds通知用户更新权限菜单
    // this.sseService.noticeClientToUpdateMenusByMenuIds([id])
  }

  /**
   * 检查菜单是否被角色关联
   * @param id 菜单id
   * @returns 是否被角色关联
   */
  async checkRoleByMenuId(id: number): Promise<boolean> {
    return !!(await this.menuRepository.findOne({
      where: {
        roles: {
          id
        }
      }
    }))
  }

  /**
   * 查找子菜单
   * @param mid 菜单id
   * @returns 子菜单id列表
   */
  async findChildMenus(mid: number): Promise<number[]> {
    // 存储所有找到的子菜单ID
    const allMenuIds: number[] = []

    // 1. 查找直接子菜单
    const menus = await this.menuRepository.findBy({ parentId: mid })
    // 2. 遍历每个子菜单
    for (const menu of menus) {
      // 如果是目录或菜单，继续查找子项
      if (menu.type === 0 || menu.type === 1) {
        // 3. 递归查找子菜单的子菜单
        const childMenuIds = await this.findChildMenus(menu.id)
        allMenuIds.push(...childMenuIds)
      }
      allMenuIds.push(menu.id)
    }
    return allMenuIds
  }

  /**
   * 删除菜单
   * @param mids 菜单id列表
   */
  async delete(mids: number[]): Promise<void> {
    await this.menuRepository.delete(mids)
  }
}
