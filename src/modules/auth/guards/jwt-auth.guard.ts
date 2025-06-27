import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { FastifyRequest } from 'fastify'
import Redis from 'ioredis'
import { isEmpty } from 'lodash'
import { ExtractJwt } from 'passport-jwt'
import { Observable } from 'rxjs'
import { InjectRedis } from '~/common/decorators/inject-redis.decorator'
import { BusinessException } from '~/common/exceptions/biz.exception'
import { AppConfig, RouterWhiteList, TAppConfig } from '~/config'
import { ErrorEnum } from '~/constants/error-code.constant'
import { genTokenBlacklistKey } from '~/helper/genRedisKey'
import { AuthStrategy, PUBLIC_KEY } from '../auth.constant'
import { AuthService } from '../auth.service'

interface RequestType {
  Params: {
    uid?: number
  }
  Querystring: {
    token?: string
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard(AuthStrategy.JWT) {
  jwtFromRequestFn = ExtractJwt.fromAuthHeaderAsBearerToken()

  constructor(
    private reflector: Reflector,
    private authService: AuthService,
    // private tokenService: any,
    @InjectRedis() private readonly redis: Redis,
    @Inject(AppConfig.KEY) private appConfig: TAppConfig,
  ) {
    super()
  }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const request = context.switchToHttp().getRequest<FastifyRequest<RequestType>>()

    /** 1、白名单路由 -- 放行 */
    if (RouterWhiteList.includes(request.routeOptions.url)) {
      return true
    }

    /** 对于SSE请求，由于前端的SSE 无法设置自定义请求头！所以通过Query传递【TODO: 安全性考虑】 */
    const isSSE = request.headers.accept === 'text/event-stream'
    if (isSSE && !request.headers.authorization?.startsWith('Bearer ')) {
      const token = request.query.token
      if (token) {
        request.headers.authorization = `Bearer ${token}`
      }
    }

    // 获取token
    const token = this.jwtFromRequestFn(request)

    /** 检查token是否在黑名单列表 */
    if (await this.redis.get(genTokenBlacklistKey(token))) {
      throw new BusinessException(ErrorEnum.INVALID_LOGIN)
    }

    request.accessToken = token

    let result: any = false
    try {
      /** JWT签名验证 & Token过期检查 & 用户信息解析 */
      result = await super.canActivate(context)
    }
    /** JWT 验证异常 | 过期 | 无效 */
    catch (error) {
      /** 后置判断（因为携带token的用户才能在try中解析到用户信息）；白名单放行！ */
      if (isPublic)
        return true

      /** 无token 处理 */
      if (isEmpty(token)) {
        throw new UnauthorizedException('未登录')
      }

      if (error instanceof UnauthorizedException) {
        throw new BusinessException(ErrorEnum.INVALID_LOGIN)
      }
    }

    return result
  }
}
