import { ConfigType, registerAs } from '@nestjs/config'
import dotenv from 'dotenv'
import { DataSource, DataSourceOptions } from 'typeorm'
import { env, envOfBoolean, envOfNumber } from '~/global/env'

dotenv.config({ path: `.env.${process.env.NODE_ENV}` })

// 当前通过 npm scripts 执行的命令
// 比如当你运行 npm run typeorm 时，这个变量的值就是 "typeorm"。
const currentScript = process.env.npm_lifecycle_event

const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: env('DB_HOST', '127.0.0.1'),
  port: envOfNumber('DB_PORT', 3306),
  username: env('DB_USERNAME'),
  password: env('DB_PASSWORD'),
  database: env('DB_DATABASE'),
  synchronize: envOfBoolean('DB_SYNCHRONIZE', false),
  // 解决通过 pnpm migration:run 初始化数据时，遇到的 SET FOREIGN_KEY_CHECKS = 0; 等语句报错问题, 仅在执行数据迁移操作时设为 true
  multipleStatements: currentScript === 'typeorm',
  entities: ['dist/modules/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  subscribers: ['dist/modules/**/*.subscriber{.ts,.js}'],
}

export const dbKey = 'database'

export const DatabaseConfig = registerAs(
  dbKey,
  (): DataSourceOptions => dataSourceOptions,
)

export type TDatabaseConfig = ConfigType<typeof DatabaseConfig>

const dataSource = new DataSource(dataSourceOptions)

export default dataSource
