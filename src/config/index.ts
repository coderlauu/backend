import { AppConfig, appKey, TAppConfig } from './app.config'
import { DatabaseConfig, dbKey, TDatabaseConfig } from './database.config'
import { SwaggerConfig, swaggerKey, TSwaggerConfig } from './swagger.config'
import { securityKey, TSecurityConfig } from './security.config'
import { SecurityConfig } from './security.config'
import { redisKey, TRedisConfig } from './redis.config'
import { RedisConfig } from './redis.config'
import { mailerKey, MailerConfig, TMailerConfig } from './mailer.config'

export * from './app.config'
export * from './database.config'
export * from './swagger.config'
export * from './redis.config'
export * from './mailer.config'
export * from './security.config'

export interface AllConfigType {
  [appKey]: TAppConfig
  [swaggerKey]: TSwaggerConfig
  [dbKey]: TDatabaseConfig
  [securityKey]: TSecurityConfig
  [redisKey]: TRedisConfig
  [mailerKey]: TMailerConfig
}

export type ConfigKeyPaths = RecordNamePaths<AllConfigType>

export default {
  AppConfig,
  SwaggerConfig,
  DatabaseConfig,
  SecurityConfig,
  RedisConfig,
  MailerConfig
}
