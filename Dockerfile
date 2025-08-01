# 遇到网络问题可以配置镜像加速：https://gist.github.com/y0ngb1n/7e8f16af3242c7815e7ca2f0833d3ea6

# base基础镜像  slim比alpine兼容性更好，比完整版本更小
FROM node:20-slim AS base

# ARG PROJECT_DIR - 接收 docker-compose 传递的项目目录参数
ARG PROJECT_DIR

# 设置环境变量
ENV DB_HOST=mysql \
    APP_PORT=7001 \
    PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH"

# 启用 Node.js 内置的包管理器管理工具
RUN corepack enable \
    && yarn global add pm2

# WORKDIR指令用于设置Dockerfile中的RUN、CMD和ENTRYPOINT指令执行命令的工作目录(默认为/目录)，该指令在Dockerfile文件中可以出现多次，
# 如果使用相对路径则为相对于WORKDIR上一次的值，
# 例如WORKDIR /data，WORKDIR logs，RUN pwd最终输出的当前目录是/data/logs。
# cd 到 /nest-admin
WORKDIR $PROJECT_DIR

# 将项目文件复制到容器中
COPY ./ $PROJECT_DIR
RUN chmod +x ./wait-for-it.sh 

# 设置容器时区为上海时区（东八区）
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo 'Asia/Shanghai' > /etc/timezone

# see https://pnpm.io/docker
# 只安装生产环境依赖；使用锁文件，确保版本一致性
# 使用构建缓存
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile 

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build


# mirror acceleration
# RUN npm config set registry https://registry.npmmirror.com
# RUN pnpm config set registry https://registry.npmmirror.com
# RUN npm config rm proxy && npm config rm https-proxy

FROM base
COPY --from=prod-deps $PROJECT_DIR/node_modules $PROJECT_DIR/node_modules
COPY --from=build $PROJECT_DIR/dist $PROJECT_DIR/dist

# EXPOSE port
EXPOSE $APP_PORT

# 容器启动时执行的命令，类似npm run start
# CMD ["pnpm", "start:prod"]
# CMD ["pm2-runtime", "ecosystem.config.js"]
ENTRYPOINT ./wait-for-it.sh $DB_HOST:$DB_PORT -- pnpm migration:run && pm2-runtime ecosystem.config.js
