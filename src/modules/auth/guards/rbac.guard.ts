import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthService } from "../auth.service";
import { Observable } from "rxjs";
import { ALLOW_ANON_KEY, PERMISSION_KEY, PUBLIC_KEY, Roles } from "../auth.constant";
import { BusinessException } from "~/common/exceptions/biz.exception";
import { ErrorEnum } from "~/constants/error-code.constant";









@Injectable()
export class RbacGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private authService: AuthService
    ) {}

    async canActivate(context: ExecutionContext): Promise<any> {
        // getAllAndOverride() - 多层级检查
        const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
            context.getHandler(),    // 方法级别
            context.getClass()      // 类级别
        ])
        // isPublic - 不需要登录和权限 都可以访问
        if (isPublic) return true

        const request = context.switchToHttp().getRequest()

        const { user } = request
        if (!user) {
            throw new BusinessException(ErrorEnum.INVALID_LOGIN)
        }

        // get() - 单层级检查
        const allowAnon = this.reflector.get<boolean>(ALLOW_ANON_KEY, context.getHandler())
        // AllowAnon - 需要登录，但不需要权限 可访问
        if (allowAnon) return true

        const payloadPermission = this.reflector.getAllAndOverride<string | string[]>(PERMISSION_KEY, [
            context.getHandler(),
            context.getClass()
        ])

        console.log('payloadPermission', payloadPermission);
        
        // 控制器没有设置接口权限，则默认通过
        if (!payloadPermission) return true

        // 管理员角色，默认通过
        if (user.roles.includes(Roles.ADMIN)) return true

        // 获取当前用户所拥有的所有权限，先从redis中获取，没有则从数据库中获取
        const allPermissions = await this.authService.getPermissionsCache(user.uid) ?? await this.authService.getPermissions(user.uid)

        let isPass = false
        if (Array.isArray(payloadPermission)) {
            // 只要有一个权限通过，则通过
            isPass = payloadPermission.some(i => allPermissions.includes(i))
        }
        else if (typeof payloadPermission === 'string') {
            isPass = allPermissions.includes(payloadPermission)
        }

        if (!isPass) {
            throw new BusinessException(ErrorEnum.NO_PERMISSION)
        }

        return true
    }
}