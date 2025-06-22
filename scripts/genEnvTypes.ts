/**
 * 执行此命令之后，运行genEnvTypes文件，读取 .env 文件，生成types/env.d.ts 文件，为环境变量提供TS支持
 */

import fs from 'node:fs'
import path from 'node:path'

import dotenv from 'dotenv'

// 项目根目录路径
const rootDitPath = path.resolve(__dirname, '..')

/** 获取 .env\.env.* 文件路径 */
const targets = ['.env', `.env.${process.env.NODE_ENV || 'development'}`]

/** 合并多个.env文件的内容  */
const mergeEnvObj = targets.reduce((prev, file) => {
  // 解析 .env 文件的内容为键值对对象
  const result = dotenv.parse(fs.readFileSync(path.join(rootDitPath, file)))
  return { ...prev, ...result }
}, {})

/** 为环境变量对象集生成key:value的类型声明 */
const mergeEnvType = Object.entries(mergeEnvObj).reduce((prev, [key, value]) => {
  return `${prev}
    ${key}: '${value}';`
}, '').trim()

fs.writeFile(path.join(rootDitPath, 'types/env.d.ts'), `
// generate by ./scripts/generateEnvTypes.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ${mergeEnvType}
    }
  }
}
export {}
`, (err) => {
  if (err) {
    console.error('types/env.d.ts 文件生成失败~', err)
  }
  else {
    console.log('types/env.d.ts 文件生成成功~')
  }
})
