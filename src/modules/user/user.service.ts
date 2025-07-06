import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import Redis from 'ioredis'
import { isEmpty, isNil } from 'lodash'
import { use } from 'passport'
import { EntityManager, In, Like, Repository } from 'typeorm'
import { InjectRedis } from '~/common/decorators/inject-redis.decorator'
import { BusinessException } from '~/common/exceptions/biz.exception'
import { ErrorEnum } from '~/constants/error-code.constant'
import { ROOT_ROLE_ID, SYS_USER_INITPASSWORD } from '~/constants/system.constant'
import { genAuthPermKey, genAuthPVKey, genAuthTokenKey, genOnlineUserKey } from '~/helper/genRedisKey'
import { paginate } from '~/helper/paginate'
import { Pagination } from '~/helper/paginate/Pagination'
import { QQService } from '~/shared/helper/qq.service'
import { randomValue } from '~/utils'
import { md5 } from '~/utils/crypto'
import { AccountUpdateDto } from '../auth/dto/account.dto'
import { RegisterDto } from '../auth/dto/auth.dto'
import { AccessTokenEntity } from '../auth/entities/access-token.entity'
import { DeptEntity } from '../system/dept/dept.entity'
import { ParamConfigService } from '../system/param-config/param-config.service'
import { RoleEntity } from '../system/role/role.entity'
import { UserStatus } from './constant'
import { UserDto, UserQueryDto, UserUpdateDto } from './dto/user.dto'
import { UserEntity } from './user.entity'
import { AccountInfo } from './user.model'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity) private readonly roleRepository: Repository<RoleEntity>,
    private readonly entityManager: EntityManager,
    @InjectRedis() private readonly redis: Redis,
    private readonly qqService: QQService,
    private readonly paramConfigService: ParamConfigService,
  ) {}

  /**
   * 管理员创建系统用户
   * 🏢 管理后台功能：管理员在后台创建员工账号
   * 👨‍💼 完整用户信息：包含角色、部门、完整个人信息
   * 🔐 权限分配：创建时就分配角色和权限
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
        const initPassword = await this.paramConfigService.findValueByKey(SYS_USER_INITPASSWORD) // 从配置中心获取初始密码
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
        // 使用注入的 Repository
        roles: await this.roleRepository.findBy({ id: In(roleIds) }),
        // 使用 Entity 静态方法；不适用注入的方式是防止循环依赖，因为deptModule已经依赖了userModule了，userModule不能再依赖deptModule
        dept: await DeptEntity.findOneBy({ id: deptId }),
      })

      const result = await manager.save(u)
      return result
    })
  }

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
      username,
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
        psalt: salt,
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
      status: UserStatus.Enabled,
    }).getOne()
  }

  /**
   * 获取用户列表
   *
   */
  async list({
    page,
    pageSize,
    username,
    nickname,
    deptId,
    status,
  }: UserQueryDto): Promise<Pagination<UserEntity>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('user.dept', 'dept')
      .where({
        ...(username ? { username: Like(`%${username}%`) } : null),
        ...(nickname ? { nickname: Like(`%${nickname}%`) } : null),
        ...(!isNil(status) ? { status } : null),
      })

    if (deptId) {
      queryBuilder.andWhere('dept.id = :deptId', { deptId })
    }

    return paginate(queryBuilder, {
      page,
      pageSize,
    })
  }

  /**
   * 根据id查询用户信息
   * @param id 用户id
   * @returns 用户信息
   */
  async info(id: number): Promise<UserEntity> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('user.dept', 'dept')
      .where('user.id = :id', { id })
      .getOne()

    delete user.psalt

    return user
  }

  /**
   * 获取用户信息
   * @param id 用户id
   * @returns 用户信息
   */
  async getAccountInfo(uid: number): Promise<AccountInfo> {
    const user: UserEntity = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('user.id = :uid', { uid })
      .getOne()

    if (isEmpty(user)) {
      throw new BusinessException(ErrorEnum.USER_NOT_FOUND)
    }

    delete user?.psalt

    return user
  }

  /**
   * 禁用用户
   * @param uid 用户id
   * @param accessToken 可选，accessToken
   */
  async forbidden(uid: number, accessToken?: string): Promise<void> {
    await this.redis.del(genAuthPVKey(uid))
    await this.redis.del(genAuthTokenKey(uid))
    await this.redis.del(genAuthPermKey(uid))
    if (accessToken) {
      const token = await AccessTokenEntity.findOne({
        where: { value: accessToken },
      })
      this.redis.del(genOnlineUserKey(token.id))
    }
  }

  /**
   * 更新个人信息
   */
  async updateAccountInfo(uid: number, info: AccountUpdateDto): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: uid })
    if (isEmpty(user)) {
      throw new BusinessException(ErrorEnum.USER_NOT_FOUND)
    }

    const data = {
      ...(info.nickname ? { nickname: info.nickname } : null),
      ...(info.email ? { email: info.email } : null),
      ...(info.qq ? { qq: info.qq } : null),
      ...(info.phone ? { phone: info.phone } : null),
      ...(info.avatar ? { avatar: info.avatar } : null),
      ...(info.remark ? { remark: info.remark } : null),
    }

    if (!info.avatar && info.qq) {
      if (info.qq !== user.qq) {
        data.avatar = await this.qqService.getAvatar(info.qq)
      }
    }

    await this.userRepository.update(uid, data)
  }

  /**
   * 更新用户信息
   * @param id 用户id
   * @param dto 更新信息
   */
  async update(id: number, { password, deptId, roleIds, status, ...dto }: UserUpdateDto): Promise<void> {
    await this.entityManager.transaction(async (manager) => {
      if (password) {
        await this.forceUpdatePassword(id, password)
      }

      await manager.update(UserEntity, id, {
        ...dto,
        status,
      })

      const user = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'roles')
        .leftJoinAndSelect('user.dept', 'dept')
        .where('user.id = :id', { id })
        .getOne()

      if (roleIds) {
        // 先删除当前用户的所有角色
        // 再插入当前用户所拥有的新的角色
        await manager.createQueryBuilder()
          .relation(UserEntity, 'roles')
          .of(id)
          .addAndRemove(roleIds, user.roles)
      }

      if (deptId) {
        await manager.createQueryBuilder()
          .relation(UserEntity, 'dept')
          .of(id)
          .set(deptId)
      }

      if (status === 0) {
        await this.forbidden(id)
      }
    })
  }

  /** 强制更新用户密码 */
  async forceUpdatePassword(id: number, password: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id })
    if (isEmpty(user)) {
      throw new BusinessException(ErrorEnum.USER_NOT_FOUND)
    }

    const passwordInSalt = md5(`${password}${user.psalt}`)
    await this.userRepository.update({ id }, { password: passwordInSalt })
    await this.upgradePasswordV(user.id)
  }

  /** 升级用户版本密码 */
  async upgradePasswordV(id: number): Promise<void> {
    const currentVersion = await this.redis.get(genAuthPVKey(id))
    if (!isEmpty(currentVersion)) {
      await this.redis.set(genAuthPVKey(id), Number.parseInt(currentVersion) + 1)
    }
  }

  /**
   * 删除用户
   * @param ids 用户id
   */
  async delete(userIds: number[]): Promise<void> {
    const rootUserId = await this.findRootUserId()
    if (userIds.includes(rootUserId)) {
      throw new BadRequestException('不能删除超级管理员')
    }

    await this.userRepository.delete(userIds)
  }

  /** 查找超级管理员id */
  async findRootUserId(): Promise<number> {
    const user = await this.userRepository.findOneBy({
      roles: { id: ROOT_ROLE_ID },
    })
    return user.id
  }

  /**
   * 批量禁用用户
   * @param userIds 用户ids
   */
  async multiForbidden(userIds: number[]): Promise<void> {
    if (userIds) {
      const pvs: string[] = []
      const tokens: string[] = []
      const perms: string[] = []
      userIds.forEach((uid) => {
        pvs.push(genAuthPVKey(uid))
        tokens.push(genAuthTokenKey(uid))
        perms.push(genAuthPermKey(uid))
      })
      await this.redis.del(pvs)
      await this.redis.del(tokens)
      await this.redis.del(perms)
    }
  }
}
