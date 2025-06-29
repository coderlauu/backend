import { HttpStatus, NotAcceptableException, Param, ParseIntPipe } from "@nestjs/common";

export function IdParam() {
    // 类型转换：将字符串 "123" 转换为数字 123
    // 格式验证：检查是否为有效的整数格式
    return Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE, exceptionFactory: (_error) => {
        throw new NotAcceptableException('id 格式不正确')
    } }))
}