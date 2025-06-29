import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { FastifyRequest } from "fastify";

type Payload = keyof IAuthUser

export const AuthUser = createParamDecorator(
    (data: Payload, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<FastifyRequest>()
        
        // auth guard守卫将会将用户信息添加到request对象中
        const user = request.user as IAuthUser

        return data ? user?.[data] : user
    }
)