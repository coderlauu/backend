import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '~/common/exceptions/biz.exception';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { Repository } from 'typeorm';
import { ErrorEnum } from '~/constants/error-code.constant';
import { UserService } from '../user/user.service';
import { isEmpty } from 'lodash';
import { md5 } from '~/utils/crypto';
import { RoleService } from '../system/role/role.service';
import { TokenService } from './services/token.service';
import { InjectRedis } from '~/common/decorators/inject-redis.decorator';
import Redis from 'ioredis';
import { genAuthPVKey, genAuthTokenKey } from '~/helper/genRedisKey';
import { SecurityConfig, TSecurityConfig } from '~/config/security.config';
import { LoginLogService } from '../system/log/services/login-log.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        // private readonly roleService: RoleService,
        private readonly tokenService: TokenService,
        @InjectRedis() private readonly redis: Redis,
        @Inject(SecurityConfig.KEY) private readonly securityConfig: TSecurityConfig,
        private readonly loginLogService: LoginLogService
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
            throw new BusinessException(ErrorEnum.INVALID_USERNAME_PASSWORD)
        }

        const parsePassword = md5(`${password}${user.psalt}`)
        if (password !== parsePassword) {
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
}
