import { ConfigType, registerAs } from '@nestjs/config'
import { env, envOfNumber } from '~/global/env'

export const securityKey = 'security'

export const SecurityConfig = registerAs(securityKey, () => ({
  jwtSecret: env('JWT_SECRET'),
  jwtExpire: envOfNumber('JWT_EXPIRE'),
  refreshSecret: env('REFRESH_TOKEN_SECRET'),
  refreshExpire: envOfNumber('REFRESH_TOKEN_EXPIRE'),
}))

export type TSecurityConfig = ConfigType<typeof SecurityConfig>
