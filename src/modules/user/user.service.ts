import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { isEmpty } from 'lodash'
import { EntityManager, In, Repository } from 'typeorm'
import { BusinessException } from '~/common/exceptions/biz.exception'
import { ErrorEnum } from '~/constants/error-code.constant'
import { randomValue } from '~/utils'
import { md5 } from '~/utils/crypto'
import { DeptEntity } from '../system/dept/dept.entity'
import { RoleEntity } from '../system/role/role.entity'
import { UserDto } from './dto/user.dto'
import { UserEntity } from './user.entity'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity) private readonly roleRepository: Repository<RoleEntity>,
    private readonly entityManager: EntityManager,
  ) {}

  /**
   * 新增用户
   * @param dto 用户信息
   */
  async create(dto: UserDto): Promise<void> {
    let { username, password, roleIds, deptId, ...data } = dto

    const exists = await this.userRepository.findOneBy({
      username,
    })
    if (!isEmpty(exists)) {
      throw new BusinessException(ErrorEnum.SYSTEM_USER_EXISTS)
    }

    await this.entityManager.transaction(async (manager) => {
      const salt = randomValue(32)

      if (!password) {
        // const initPassword = await this.paramConfigService.findValueByKey() // 从配置中心获取初始密码
        const initPassword = '123456'
        password = md5(`${initPassword ?? '123456'}${salt}`)
      }
      else {
        password = md5(`${password ?? '123456'}${salt}`)
      }

      const u = manager.create(UserEntity, {
        username,
        password,
        ...data,
        psalt: salt,
        roles: await this.roleRepository.findBy({ id: In(roleIds) }),
        dept: await DeptEntity.findOneBy({ id: deptId }),
      })
    })
  }
}
