import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AccessTokenEntity } from "../entities/access-token.entity";
import { UserEntity } from "~/modules/user/user.entity";
import dayjs from "dayjs";
import { SecurityConfig, TSecurityConfig } from "~/config/security.config";
import { generateUUID } from "~/utils";
import { RefreshTokenEntity } from "../entities/refresh-token.entity";



/**
 * 令牌服务
 */
@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        /** 自定义装饰器  注入 -->等价于 @Inject(REDIS_CLIENT) private redis: Redis */
        // @InjectRedis() private redis: Redis,
        /** 标准装饰器 注入 */
        @Inject(SecurityConfig.KEY) private readonly securityConfig: TSecurityConfig
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
}