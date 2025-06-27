import { ConfigType, registerAs } from '@nestjs/config'
import { env, envOfNumber } from '~/global/env'

export const securityKey = 'security'

export const SecurityConfig = registerAs(securityKey, () => ({
  /** 用于accessToken的加密 -> 短期有效 -> 用于api的鉴权 -> 包含用户id+角色 */
  jwtSecret: env('JWT_SECRET'),
  jwtExpire: envOfNumber('JWT_EXPIRE'),
  /** 用于refreshToken的加密 -> 长期有效 -> 用于刷新accessToken -> 包含uuid */
  refreshSecret: env('REFRESH_TOKEN_SECRET'),
  refreshExpire: envOfNumber('REFRESH_TOKEN_EXPIRE'),
}))

export type TSecurityConfig = ConfigType<typeof SecurityConfig>
