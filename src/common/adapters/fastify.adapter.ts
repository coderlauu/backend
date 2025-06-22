/**
 * 🚀 为什么用 Fastify？
 * 相比 Express，Fastify 提供：
 * ⚡ 更高性能：比 Express 快约 2-3 倍
 * 🔧 内置功能：JSON 解析、验证、序列化等
 * 🛡️ 类型安全：更好的 TypeScript 支持
 * 📦 生态系统：丰富的插件体系
 */

import FastifyCookie from '@fastify/cookie'
import FastifyMultipart from '@fastify/multipart'
import { HttpStatus } from '@nestjs/common'
import { FastifyAdapter } from '@nestjs/platform-fastify'

/** 1. 基础 Fastify 适配器 */
const app: FastifyAdapter = new FastifyAdapter({
  trustProxy: true,
  logger: false,
})

/**
 * @description 文件上传配置
 * 支持 multipart/form-data 文件上传
 * 限制上传文件的数量和大小，防止滥用
 */
app.register(FastifyMultipart, {
  limits: {
    fields: 10, // 最多 10 个普通字段
    fileSize: 1024 * 1024 * 6, // 单文件最大 6MB
    files: 5, // 最多 5 个文件
  },
})

/**
 * @description 配置 cookie 插件
 */
app.register(FastifyCookie, {
  secret: 'cookie-secret', // 这个 secret 不太重要，不存鉴权相关，无关紧要
})

/**
 * @description 请求预处理中间件
 */
app.getInstance().addHook('onRequest', (request, reply, done) => {
  const { origin } = request.headers
  if (!origin) {
    request.headers.origin = request.headers.host
  }

  const { url } = request

  if (url.endsWith('.php')) {
    reply.raw.statusMessage
      = 'PHP 很棒但我不支持'

    return reply.code(HttpStatus.I_AM_A_TEAPOT).send()
  }

  // 跳过 favicon 请求
  if (url.match(/favicon.ico$/) || url.match(/manifest.json$/)) {
    return reply.code(HttpStatus.NO_CONTENT).send()
  }

  done()
})

export { app as fastifyApp }
