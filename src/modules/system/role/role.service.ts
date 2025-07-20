import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { isEmpty, isNil } from 'lodash'
import { EntityManager, In, Like, Repository } from 'typeorm'
import { ROOT_ROLE_ID } from '~/constants/system.constant'
import { paginate } from '~/helper/paginate'
import { Pagination } from '~/helper/paginate/pagination'
import { MenuEntity } from '../menu/menu.entity'
import { RoleDto, RoleQueryDto, RoleUpdateDto } from './role.dto'
import { RoleEntity } from './role.entity'

@Injectable()
export class RoleService {
  constructor(
        @InjectRepository(RoleEntity) private readonly roleRepository: Repository<RoleEntity>,
        @InjectRepository(MenuEntity) private readonly menuRepository: Repository<MenuEntity>,
        private readonly entityManager: EntityManager,
  ) {}

  /**
   * 根据用户id获取角色id列表
   * @param id 用户id
   * @returns 角色id列表
   */
  async getRoleIdsByUser(id: number): Promise<number[]> {
    const roles = await this.roleRepository.find({
      where: {
        users: {
          id,
        },
      },
    })

    if (!isEmpty(roles)) {
      return roles.map(role => role.id)
    }

    return []
  }

  hasAdminRole(roleIds: number[]): boolean {
    return roleIds.includes(ROOT_ROLE_ID)
  }

  /**
   * 获取角色列表
   * @param dto
   * @returns
   */
  async list({
    page,
        pageSize,
        name,
        value,
        remark,
        status,
  }: RoleQueryDto): Promise<Pagination<RoleEntity>> {
    const queryBuilder = await this.roleRepository
      .createQueryBuilder('role')
      .where({
        ...(name ? { name: Like(`%${name}%`) } : null),
        ...(value ? { value: Like(`%${value}%`) } : null),
        ...(remark ? { remark: Like(`%${remark}%`) } : null),
        ...(!isNil(status) ? { status } : null),
      })

    return paginate<RoleEntity>(queryBuilder, {
      page,
      pageSize,
    })
  }

  /**
   * 获取角色详情
   * @param id 角色id
   * @returns 角色详情
   */
  async detail(id: number) {
    const role = await this.roleRepository.findOne({
      where: { id },
    })

    // 获取menuIds
    const menus = await this.menuRepository.find({
      where: { roles: { id } },
      select: ['id'],
    })

    return { ...role, menuIds: menus.map(m => m.id) }
  }

  /**
   * 新增角色
   * @param dto
   * @returns
   */
  async create(dto: RoleDto): Promise<{ roleId: number }> {
    const { menuIds, ...role } = dto
    // 1、将除了菜单权限menuIds以外的字段保存插入到role表
    // 2、将menuIds保存到sys_role_menu表
    const roleEntity = await this.roleRepository.save({
      ...role,
      // 将menuIds在menu表中查询出来，比如menuIds为[1,2,3]，则menus为menu表中id为1、2、3的菜单
      // 这时，中间表会记录roleId所关联的menuIds -> roleId: 10, menuIds: [1,2,3]
      menus: menuIds ? await this.menuRepository.findBy({ id: In(menuIds) }) : [],
    })

    /**
      // 1. 原有数据：角色1 关联 菜单[1,2,3]
      // 2. 新数据：角色1 要关联 菜单[2,3,4,5]
      // 3. TypeORM 会自动：
      //    - 删除关联：角色1-菜单1
      //    - 保持关联：角色1-菜单2, 角色1-菜单3
      //    - 新增关联：角色1-菜单4, 角色1-菜单5
     */

    return { roleId: roleEntity.id }
  }

  /**
   * 更新角色
   * @param id 角色id
   * @param dto 基础字段、菜单权限ids
   */
  async update(id: number, dto: RoleUpdateDto): Promise<void> {
    const { menuIds, ...role } = dto

    // 先更新基础字段
    await this.roleRepository.update(id, role)
    // 使用事务，确保当执行this.menuRepository.findBy失败时，role表的更新可以回滚，避免数据不一致
    await this.entityManager.transaction(async (manager) => {
      const role = await this.roleRepository.findOne({ where: { id } })
      role.menus = menuIds.length ? await this.menuRepository.findBy({ id: In(menuIds) }) : []
      await manager.save(role)
    })
  }

  /**
   * 检查角色是否被用户关联
   * @param id 角色id
   * @returns 是否被用户关联
   */
  async checkUserByRoleId(id: number): Promise<boolean> {
    return await this.roleRepository.exists({
      where: {
        users: {
          roles: { id },
        },
      },
    })
  }

  /**
   * 删除角色
   * @param id 角色id
   */
  async delete(id: number): Promise<void> {
    await this.roleRepository.delete(id)
  }
}
