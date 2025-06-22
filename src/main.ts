import cluster from 'node:cluster'
import path from 'node:path'
import { HttpStatus, Logger, UnprocessableEntityException, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestFastifyApplication } from '@nestjs/platform-fastify'
import { useContainer } from 'class-validator'
import { AppModule } from './app.module'
import { fastifyApp } from './common/adapters/fastify.adapter'
import { RedisIoAdapter } from './common/adapters/socket.adapter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { ConfigKeyPaths } from './config'
import { isDev, isMainProcess } from './global/env'
import { setupSwagger } from './setup-swagger'
import { LoggerService } from './shared/logger/logger.service'

/** module对象是Node.js运行时提供，通过declare声明，告诉TS这个module是存在的，否则会报错 */
declare const module: any

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyApp, {
    // 缓存日志输出，在应用完全启动前不会立即打印日志
    bufferLogs: true,
    // 启用应用快照功能，用于性能分析和调试
    snapshot: true,
    // forceCloseConnections: true,
  })

  const configService = app.get(ConfigService<ConfigKeyPaths>)
  const { port, globalPrefix } = configService.get('app', { infer: true })

  // class-validator 的 DTO 类中注入 nest 容器的依赖 (用于自定义验证器)
  useContainer(app.select(AppModule), { fallbackOnErrors: true })

  // 允许跨域
  app.enableCors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // 明确允许方法
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'], // 按需配置允许的请求头
  })

  app.setGlobalPrefix(globalPrefix)
  app.useStaticAssets({ root: path.join(__dirname, '..', 'public') })
  // 应用关闭时执行清理操作（如关闭数据库连接、清理资源等）
  !isDev && app.enableShutdownHooks()

  if (isDev) {
    /** 请求日志拦截器 */
    app.useGlobalInterceptors(new LoggingInterceptor())
  }

  /** 设置全局数据验证管道 */
  app.useGlobalPipes(
    new ValidationPipe({
      // 自动转换数据类型
      transform: true,
      // 只保留 DTO 中定义的属性，过滤掉额外的字段
      whitelist: true,
      transformOptions: {
        // 启用隐式类型转换 -> "true" 自动转为 true
        enableImplicitConversion: true,
      },
      // 如果启用，遇到未定义的字段会直接抛错
      // forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      // 遇到第一个验证错误就停止，不继续验证其他字段
      stopAtFirstError: true,
      exceptionFactory(errors) {
        return new UnprocessableEntityException(
          errors.map((error) => {
            const rule = Object.keys(error.constraints!)[0] // 获取第一个违规规则
            const msg = error.constraints![rule] // 获取错误消息
            return msg
          })[0], // 只返回第一个错误消息
        )
      },
    }),
  )

  /**
   * @description 设置Redis
   * 允许多个服务实例之间共享WS事件和消息，通过Redis作为消息代理实现跨实例通信
   */
  app.useWebSocketAdapter(new RedisIoAdapter(app))

  /** 设置swagger */
  const printSwaggerLog = setupSwagger(app, configService)

  /**
   * 0.0.0.0 是监听地址，表示：服务器会监听所有可用的 IP 地址，允许外部访问【不仅限于localhost/127.0.0.1】，适用于生产环境
   */
  await app.listen(port, '0.0.0.0', async () => {
    app.useLogger(app.get(LoggerService))
    /** 包含全局前缀和端口的应用地址-> eg: http://localhost:3000/api */
    const url = await app.getUrl()
    const { pid } = process
    const env = cluster.isPrimary
    const prefix = env ? 'Master' : 'Worker'

    /** 确保只有主进程才会输出这些启动日志，避免日志重复和混乱。 */
    if (!isMainProcess)
      return

    printSwaggerLog?.()

    const logger = new Logger('NestApplication')
    logger.log(`[${prefix}->${pid}] Server running on ${url}`)
  })

  if (module.hot) {
    /**
     * 模块级热替换 - 不会丢失内存中的状态（如 WebSocket 连接、缓存等）
     * 区别于 --watch 模式，--watch 模式会重新启动整个应用，而模块级热替换只会重新加载修改的模块
     */
    module.hot.accept()
    module.hot.dispose(() => app.close())
  }
}
bootstrap()
