import cluster from "node:cluster"

/**
 * PM2 集群模式下：
 * - cluster.isPrimary 始终为 false（只在Node.js原生cluster模块中为true）
 * - NODE_APP_INSTANCE=0 标识第一个（主）实例
 *
 * 在开发模式下，isMainCluster为 undefined
 */
export const isMainClusterForPM2 = process.env.NODE_APP_INSTANCE && Number.parseInt(process.env.NODE_APP_INSTANCE) === 0
export const isMainProcess = cluster.isPrimary || isMainClusterForPM2

export const isDev = process.env.NODE_ENV === 'development'

export const isTest = !!process.env.TEST
export const cwd = process.cwd()

/**
 * 基础类型接口
 */
export type BaseType = string | number | boolean | undefined | null

/**
 * 格式化环境变量
 * @param key 环境变量的键值
 * @param defaultValue 默认值
 * @param callback 格式化函数
 */
function formatValue<T extends BaseType>(key: string, defaultValue: T, callback?: (value: string) => T) {
  const value = process.env[key]
  if (typeof value === 'undefined') {
    return defaultValue
  }

  if (!callback) {
    return value as unknown as T
  }

  return callback(value)
}

export function env(key: string, defaultValue = '') {
  return formatValue(key, defaultValue)
}

export function envOfNumber(key: string, defaultValue: number = 0) {
  return formatValue(key, defaultValue, (value) => {
    try {
      return Number(value)
    }
    catch (error) {
      throw new Error(`${key} is not a number`)
    }
  })
}

export function envOfBoolean(key: string, defaultValue: boolean = false) {
  return formatValue(key, defaultValue, (value) => {
    try {
      return Boolean(JSON.parse(value))
    }
    catch (error) {
      throw new Error(`${key} is not a boolean`)
    }
  })
}
