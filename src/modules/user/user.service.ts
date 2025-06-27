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
import { RegisterDto } from '../auth/dto/auth.dto'
import { use } from 'passport'
import { UserStatus } from './constant'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    // @InjectRepository(RoleEntity) private readonly roleRepository: Repository<RoleEntity>,
    private readonly entityManager: EntityManager,
  ) {}

  /**
   * 管理员创建系统用户   
   * 🏢 管理后台功能：管理员在后台创建员工账号   
   * 👨‍💼 完整用户信息：包含角色、部门、完整个人信息   
   * 🔐 权限分配：创建时就分配角色和权限   
   * @param dto 用户信息
   */
//   async create(dto: UserDto): Promise<void> {
//     let { username, password, roleIds, deptId, ...data } = dto

//     const exists = await this.userRepository.findOneBy({
//       username,
//     })
//     if (!isEmpty(exists)) {
//       throw new BusinessException(ErrorEnum.SYSTEM_USER_EXISTS)
//     }

//     await this.entityManager.transaction(async (manager) => {
//       const salt = randomValue(32)

//       if (!password) {
//         // const initPassword = await this.paramConfigService.findValueByKey() // 从配置中心获取初始密码
//         const initPassword = '123456'
//         password = md5(`${initPassword ?? '123456'}${salt}`)
//       }
//       else {
//         password = md5(`${password ?? '123456'}${salt}`)
//       }

//       const u = manager.create(UserEntity, {
//         username,
//         password,
//         ...data,
//         psalt: salt,
//         // 使用注入的 Repository
//         roles: await this.roleRepository.findBy({ id: In(roleIds) }),
//         // 使用 Entity 静态方法；不适用注入的方式是防止循环依赖，因为deptModule已经依赖了userModule了，userModule不能再依赖deptModule
//         dept: await DeptEntity.findOneBy({ id: deptId }),
//       })

//       const result = await manager.save(u)
//       return result
//     })
//   }

  /**
   * 用户注册   
   * 🌐 前台注册功能：用户在网站前台自己注册   
   * 👤 基础用户信息：只包含基本注册信息   
   * 🚫 无权限分配：注册时不分配任何角色   
   * @param dto 注册信息
   */
  async register(dto: RegisterDto): Promise<void> {
    const { username, password, lang } = dto

    const exists = await this.userRepository.findOneBy({
      username
    })

    if (!isEmpty(exists)) {
        throw new BusinessException(ErrorEnum.SYSTEM_USER_EXISTS)
    }

    await this.entityManager.transaction(async (manager) => {
        const salt = randomValue(32)

        const passwordInSalt = md5(`${password}${salt}`)

        const u = manager.create(UserEntity, {
            username,
            password: passwordInSalt,
            status: 1,
            psalt: salt
        })

        const user = await manager.save(u)
        return use
    })
    
  }

  /**
   * 根据用户名查询用户信息   
   * @param username 用户名   
   * @returns 用户信息
   */
  async findUserByUserName(username: string): Promise<UserEntity | undefined> {
    return await this.userRepository.createQueryBuilder('user').where({
        username,
        status: UserStatus.Enabled
    }).getOne()
  }
}
