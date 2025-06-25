import { ConfigType, registerAs } from '@nestjs/config'
import { env, envOfBoolean, envOfNumber } from '~/global/env'

export const appKey = 'app'

const globalPrefix = env('GLOBAL_PREFIX', 'api')

export const AppConfig = registerAs(appKey, () => ({
  name: env('APP_NAME'),
  port: envOfNumber('APP_PORT', 3000),
  baseUrl: env('APP_BASE_URL'),
  globalPrefix,
  locale: env('APP_LOCALE', 'zh-CN'),
  /** 是否允许多端登录 */
  multiDeviceLogin: envOfBoolean('MULTI_DEVICE_LOGIN', true),

  logger: {
    level: env('LOGGER_LEVEL', 'info'),
    maxFiles: envOfNumber('LOGGER_MAX_FILES', 1024),
  },
}))

export type TAppConfig = ConfigType<typeof AppConfig>

export const RouterWhiteList: string[] = [
  `${globalPrefix ? '/' : ''}${globalPrefix}/auth/captcha/img`,
  `${globalPrefix ? '/' : ''}${globalPrefix}/auth/login`,
]