### postinstall
- postinstall 是npm的生命周期钩子，会在npm install执行完毕后自动触发
- 执行此命令之后，运行genEnvTypes文件，读取 .env 文件，生成types/env.d.ts 文件，为环境变量提供TS支持
```json
"scripts": {
    "postinstall": "npm run gen-env-types",
    "gen-env-types": "npx tsx scripts/genEnvTypes.ts || true",
}
```

### `process.env.npm_lifecycle_event`
- process.env.npm_lifecycle_event 是 npm 提供的环境变量，它包含当前运行的 npm script 的名称。比如当你运行 npm run typeorm 时，这个变量的值就是 "typeorm"。

### 数据库配置 `typeorm` -- 通过docker compose在docker中启动数据库服务

#### 编写 docker-compose.yml
```yml
参考ocker-compose.yml文件
完善mysql配置
```

#### 启动MySql服务   
```sh
docker compose --env-file .env --env-file .env.development run -d --service-ports mysql
```
1. 此命令执行后，会在`docker-compose.yml`中读取 `mysql` 的相关配置信息
2. 检查网络 `nest_react_admin_net` 是否存在，不存在则创建；从Docker Hub上拉取对应镜像
3. 加载 `.env` 和 `.env.development` 环境变量
4. 创建并启动 MySQL 容器  
  4.0 创建容器
  4.1 挂载数据卷：
    - ./__data/mysql → /var/lib/mysql (数据持久化)
      - 当你在开发环境下对数据库的所有操作，都会实时被同步到/var/lib/mysql下，下次启动docker时，会加载到这些数据
    - ./deploy/sql → /docker-entrypoint-initdb.d/ (初始化脚本)
  4.2 设置环境变量
  4.3 启动 MySQL 服务
5. 数据库初始化阶段 ⭐
MySQL 官方镜像有个特殊机制：   
✅ 会自动执行初始化脚本的情况：
- 当 /var/lib/mysql 目录为空时（第一次启动）
- 自动执行 /docker-entrypoint-initdb.d/ 目录下的脚本（支持.sql、.sh、.sql.gz文件类型）   
❌ 不会执行初始化脚本的情况：
- 当 ./__data/mysql/ 文件夹已存在数据时
- 这就是为什么您看到注释：# 初始化的脚本，若 ./__data/mysql/ 文件夹存在数据，则不会执行初始化脚本

#### Dockerfile
- 只有在docker-compose.yml中 指定了 build: 才会执行这个文件，例如：
```yml
  nest-react-admin-server:
    # build: 会在当前目录（.）寻找 Dockerfile，并执行以构建镜像
    build:
      context: .
      args:
        - PROJECT_DIR=${PROJECT_DIR}
    ...
```
```yml
// ...忽略部分代码
ENTRYPOINT ./wait-for-it.sh $DB_HOST:$DB_PORT -- pnpm migration:run && pm2-runtime ecosystem.config.js
```

##### wait-for-it.sh 脚本作用
- 等待依赖服务：确保 MySQL 可连接后再启动应用
- 避免启动失败：防止应用在数据库未就绪时启动
##### PM2 集群模式
- pm2-runtime - 前台运行模式（适合容器）
- ecosystem.config.js - PM2 配置文件，支持集群模式

------------------------
- database.module.ts 除了此文件的配置之外，还需要对实体进行数据验证和唯一性约束
- 见 providers = [EntityExistConstraint, UniqueConstraint]
------------------------

### Redis配置

### 生成项目文档
这是一个用于生成项目文档的npm脚本命令。
```json
"scripts": {
    "doc": "compodoc -p tsconfig.json -s",
}
```
- compodoc 是一个TypeScript项目文档生成工具，参数含义：
- -p tsconfig.json：指定TypeScript配置文件
- -s：生成文档后启动本地服务器预览文档
- 运行 npm run doc 会自动分析你的TypeScript代码，生成API文档并在浏览器中打开预览。

### 关于 `--watch` 模式 与 `module.hot` 的区别
- `--watch` 模式，是应用级别的重启
- `module.hot` 模块级热替换 - 不会丢失内存中的状态（如 WebSocket 连接、缓存等）

#### 两者有优先级：
- 如果支持 HMR，会优先使用 module.hot（更快，保持状态）
- 如果不支持 HMR 或 HMR 失败，才会回退到 --watch（进程重启）

--watch 是兜底机制，module.hot 是性能优化。在支持 HMR 的环境下（如 webpack-dev-server），会优先使用热替换而不是进程重启。

### 配置全局拦截器【仅在开发环境中生效】
```ts
// main.ts
if (isDev) {
  app.useGlobalInterceptors(new LoggingInterceptor())
}
```
#### 为什么仅在开发环境中？
📊 实际对比
- 开发环境（适合详细日志）
  - 请求量少（每天几百到几千）
  - 需要详细调试信息
  - 性能要求不高
  - 存储成本可忽略
- 生产环境（需要精简日志）
  - 请求量大（每天几万到几百万）
  - 重点关注错误和性能
  - 性能要求极高
  - 存储成本敏感

💡 总结
- ✅ 避免性能损耗
- ✅ 控制日志量
- ✅ 降低存储成本
- ✅ 减少安全风险
- ✅ 符合日志级别最佳实践

### 集成 日志服务系统 winston
```json
  "dependencies": {
    "winston": "^3.17.0",
    "winston-daily-rotate-file": "^5.0.0"
  }
```
并将日志记录到 `logs/*` 目录下

### NestJs配置模块 `@nestjs/config`
将各模块的配置解耦开，各模块的配置分别从 `.env\.env.*` 中获取

### Redis适配器
```ts
// main.ts
app.useWebSocketAdapter(new RedisIoAdapter(app))
```
#### 背景
在单实例应用中，所有的 WebSocket 连接都在同一个进程中，客户端之间可以直接通信。但在集群/多实例环境下：
```text
Client A ──→ Server Instance 1
Client B ──→ Server Instance 2
Client C ──→ Server Instance 3
```
如果 Client A 想给 Client B 发消息，但他们连接到不同的服务器实例，直接通信就不可能了！
🙋🏻‍♀️所以，在分布式系统中，集群/多实例的通信往往是个需要解决的问题，在这里通过RedisAdapter来实现。
#### 解决方案
```ts
export class RedisIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: any) {
    const server = super.createIOServer(port, options)

    // 获取 Redis 发布/订阅客户端
    const { pubClient, subClient } = this.app.get(REDIS_PUBSUB)

    // 创建 Redis 适配器
    const redisAdapter = createAdapter(pubClient, subClient, {
      key: RedisIoAdapterKey, // Redis key 前缀
      requestsTimeout: 10000, // 请求超时时间
    })

    // 将 Redis 适配器应用到 Socket.IO 服务器
    server.adapter(redisAdapter)
    return server
  }
}
```
#### 🔄 工作原理
```text
Client A (Server 1) ──发消息──→ Redis ──广播──→ All Servers ──推送──→ All Clients
                                    ↓
Client B (Server 2) ←────────────── Server 2 收到广播
Client C (Server 3) ←────────────── Server 3 收到广播
```

### 全局数据验证管道
```json
"dependencies": {
  "class-transformer": "^0.5.1",
  "class-validator": "^0.14.1",
}
```
自动验证所有 API 请求的参数，确保数据符合 DTO 类中定义的验证规则。

#### 🛡️作用
✅ 自动数据验证
✅ 智能类型转换：自动类型转换，减少类型错误
✅ 安全字段过滤：过滤恶意字段，防止参数污染
✅ 友好错误提示：返回清晰的错误信息
✅ 统一验证标准

### 引入 `swagger`

```json
  "dependencies": {
    "@nestjs/swagger": "^11.1.1",
  }
```