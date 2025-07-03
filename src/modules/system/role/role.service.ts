import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { isEmpty, isNil } from 'lodash'
import { Like, Repository } from 'typeorm'
import { ROOT_ROLE_ID } from '~/constants/system.constant'
import { paginate } from '~/helper/paginate'
import { Pagination } from '~/helper/paginate/Pagination'
import { RoleQueryDto } from './role.dto'
import { RoleEntity } from './role.entity'

@Injectable()
export class RoleService {
  constructor(
        @InjectRepository(RoleEntity) private readonly roleRepository: Repository<RoleEntity>,
  ) {}

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
}
