import { SetMetadata } from "@nestjs/common";
import { ALLOW_ANON_KEY } from "../auth.constant";

/**
 * 当接口需要登录，但不需要检查权限时，可以使用该装饰器【用户信息、个人设置、登出等。。。】
 */
export const AllowAnon = () => SetMetadata(ALLOW_ANON_KEY, true)