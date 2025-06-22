import { AppConfig, appKey, TAppConfig } from './app.config'
import { DatabaseConfig, dbKey, TDatabaseConfig } from './database.config'
import { SwaggerConfig, swaggerKey, TSwaggerConfig } from './swagger.config'

export * from './app.config'
export * from './database.config'
export * from './swagger.config'

export interface AllConfigType {
  [appKey]: TAppConfig
  [swaggerKey]: TSwaggerConfig
  [dbKey]: TDatabaseConfig
}

export type ConfigKeyPaths = RecordNamePaths<AllConfigType>

export default {
  AppConfig,
  SwaggerConfig,
  DatabaseConfig,
}
