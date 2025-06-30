import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import Redis from 'ioredis'
import { isEmpty } from 'lodash'
import { Repository } from 'typeorm'
import { InjectRedis } from '~/common/decorators/inject-redis.decorator'
import { BusinessException } from '~/common/exceptions/biz.exception'
import { SecurityConfig, TSecurityConfig } from '~/config/security.config'
import { ErrorEnum } from '~/constants/error-code.constant'
import { genAuthPVKey, genAuthTokenKey, genTokenBlacklistKey } from '~/helper/genRedisKey'
import { md5 } from '~/utils/crypto'
import { LoginLogService } from '../system/log/services/login-log.service'
import { RoleService } from '../system/role/role.service'
import { UserEntity } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { LoginDto, RegisterDto } from './dto/auth.dto'
import { TokenService } from './services/token.service'
import { AppConfig, TAppConfig } from '~/config'
import { AccountMenus } from './dto/account.dto'
import { MenuService } from '../system/menu/menu.service'
import { RouteRecordRaw } from '~/utils/permission.util'

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    // private readonly roleService: RoleService,
    private readonly menuService: MenuService,
    private readonly tokenService: TokenService,
    @InjectRedis() private readonly redis: Redis,
    @Inject(SecurityConfig.KEY) private readonly securityConfig: TSecurityConfig,
    private readonly loginLogService: LoginLogService,
    @Inject(AppConfig.KEY) private readonly appConfig: TAppConfig
  ) {}

  /**
   * 1、根据用户名查询用户信息 -> 用户不存在 -> 抛出异常
   * 2、用户存在 -> (md5解析密码)判断密码是否正确 -> 密码不正确 -> 抛出异常
   * 3、密码正确 -> 根据用户id获取用户拥有的角色ids -> 根据roleIds获取角色列表
   *  3.1、根据用户id + roleIds 生成AccessToken -> 将此token存入redis，并设置对应密码版本号（每次修改密码，版本号 +1）
   *  3.2、根据用户id 获取菜单权限列表，将权限列表页存入redis
   * 4、将用户id、ip、user-agent信息存入数据库（登录日志-表）
   * 5、返回AccessToken
   * @param dto 登录信息
   * @returns token
   */
  async login(username: string, password: string, ip: string, ua: string): Promise<string> {
    const user = await this.userService.findUserByUserName(username)

    if (isEmpty(user)) {
      throw new BusinessException(ErrorEnum.USER_NOT_FOUND)
    }

    const parsePassword = md5(`${password}${user.psalt}`)

    if (user.password !== parsePassword) {
      throw new BusinessException(ErrorEnum.INVALID_USERNAME_PASSWORD)
    }

    // const roleIds = this.roleService.getRoleIdsByUser(user.id)

    // 根据用户id + roleIds 生成AccessToken -> 将此token存入redis，并设置对应密码版本号（每次修改密码，版本号 +1）
    // TODO
    const roles = []

    // 包含accessToken + refreshToken
    const token = await this.tokenService.generateAccessToken(user.id, roles)

    // 将token存入redis
    await this.redis.set(genAuthTokenKey(user.id), token.accessToken, 'EX', this.securityConfig.jwtExpire)

    // 设置密码版本号，当密码修改时，版本号 +1
    await this.redis.set(genAuthPVKey(user.id), 1)

    // 设置菜单权限
    // TODO

    // 将用户id、ip、user-agent信息存入数据库（登录日志-表）
    await this.loginLogService.create(user.id, ip, ua)

    return token.accessToken
  }

  /**
   * 
   * @param user 
   * @param accessToken 
   */
  async clearLoginStatus(user: IAuthUser, accessToken: string): Promise<void> {
    /**
     * 计算token剩余有效期；   
     * user.exp：JWT token 中的过期时间戳    
     *  -> 如果 token 有过期时间：计算剩余秒数    
     *  -> 否则使用配置的过期时间   
     * 如： 当前时间：2024-01-01 12:00:00，token过期时间：2024-01-01 14:00:00，则剩余有效期为 2小时
     */
    const exp = user.exp ? (user.exp - Date.now() / 1000).toFixed(0) : this.securityConfig.jwtExpire

    /**
     * - 防止 Token 重放攻击
     *    将剩余2小时的token存入黑名单，确保已登出的Token无法继续使用
     */
    await this.redis.set(genTokenBlacklistKey(accessToken), accessToken, 'EX', exp)
    /**
     * - 多端登录模式
     *  ✅ 允许用户在多个设备同时登录
     *  ✅ 只清除当前设备的 Token
     *  ✅ 其他设备的登录状态不受影响
     * 比如： 用户在手机、电脑、平板同时使用，只想登出当前设备
     */
    if (this.appConfig.multiDeviceLogin) {
      await this.tokenService.removeAccessToken(accessToken)
    } 
    /**
     * - 单端登录模式
     *  🔒 只允许用户在一个设备登录
     *  🔒 登出时清除该用户的所有登录状态
     *  🔒 强制其他设备下线
     * 比如：防止账号共享使用
     */
    else {
      await this.userService.forbidden(user.uid, accessToken)
    }
  }

  /**
   * 获取用户菜单
   * @param uid 用户id
   * @returns 菜单列表
   */
  async getMenus(uid: number): Promise<RouteRecordRaw[]> {
    return await this.menuService.getMenus(uid)
  }

  /**
   * 获取用户权限
   * @param uid 用户id
   * @returns 权限列表
   */
  async getPermissions(uid: number): Promise<string[]> {
    return await this.menuService.getPermissions(uid)
  }
}
