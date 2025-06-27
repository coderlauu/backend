import { createParamDecorator } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { getIp } from "~/utils/ip.util";

/**
 * 快速获取IP
 */
export const Ip = createParamDecorator((_, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest()
    return getIp(request)
})