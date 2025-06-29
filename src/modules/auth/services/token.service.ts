import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AccessTokenEntity } from "../entities/access-token.entity";
import { UserEntity } from "~/modules/user/user.entity";
import dayjs from "dayjs";
import { SecurityConfig, TSecurityConfig } from "~/config/security.config";
import { generateUUID } from "~/utils";
import { RefreshTokenEntity } from "../entities/refresh-token.entity";
import { InjectRedis } from "~/common/decorators/inject-redis.decorator";
import Redis from "ioredis";
import { genOnlineUserKey } from "~/helper/genRedisKey";



/**
 * 令牌服务
 */
@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        /** 自定义装饰器  注入 -->等价于 @Inject(REDIS_CLIENT) private redis: Redis */
        @InjectRedis() private redis: Redis,
        /** 标准装饰器 注入 */
        @Inject(SecurityConfig.KEY) private readonly securityConfig: TSecurityConfig,
    ) {}

    async generateAccessToken(uid: number, roles: string[] = []): Promise<{ accessToken: string, refreshToken: string }> {
        const payload: IAuthUser = {
            uid,
            pv: 1,
            roles   // ['admin', 'user']
        }

        /** 默认使用jwtSecret 去对 accessToken进行签名 */
        const jwtSign = await this.jwtService.signAsync(payload)

        // 生成accessToken
        const accessToken = new AccessTokenEntity()
        accessToken.value = jwtSign
        accessToken.user = { id: uid } as UserEntity
        accessToken.expired_at = dayjs().add(this.securityConfig.jwtExpire, 'second').toDate()

        await accessToken.save()

        // 生成refreshToken
        const refreshToken = await this.generateRefreshToken(accessToken, dayjs())

        return {
            accessToken: jwtSign,
            refreshToken
        }
    }

    async generateRefreshToken(accessToken: AccessTokenEntity, now: dayjs.Dayjs): Promise<string> {
        const refreshTokenPayload = {
            uuid: generateUUID()
        }

        const refreshTokenSign = await this.jwtService.signAsync(refreshTokenPayload, {
            secret: this.securityConfig.refreshSecret
        })

        const refreshToken = new RefreshTokenEntity()
        refreshToken.value = refreshTokenSign
        refreshToken.accessToken = accessToken
        refreshToken.expired_at = now.add(this.securityConfig.refreshExpire, 'second').toDate()

        await refreshToken.save()

        return refreshTokenSign
    }

    /**
     * 检查 accessToken 是否有效
     * @param value accessToken
     * @returns 如果有效返回 true，否则返回 false
     */
    async checkAccessToken(value: string): Promise<boolean> {
        let isValid = false
        try {
            await this.verifyAccessToken(value)
            const res = await AccessTokenEntity.findOne({
                where: { value },
                relations: ['user', 'refreshToken'],
                cache: true
            })
            isValid = Boolean(res)
        } catch (error) {}
        return isValid
    }

    /**
     * 验证 accessToken
     * @param token accessToken
     * @returns 如果正确返回用户对象
     */
    async verifyAccessToken(token: string): Promise<IAuthUser> {
        return this.jwtService.verifyAsync(token)
    }

    /**
     * 移除 accessToken 及相关联的 refreshToken
     * @param value accessToken
     */
    async removeAccessToken(value: string) {
        const accessToken = await AccessTokenEntity.findOne({
            where: { value }
        })
        if (accessToken) {
            await this.redis.del(genOnlineUserKey(accessToken.id))
            await accessToken.remove()
        }
    }

}