import { ApiProperty } from "@nestjs/swagger";
import { RESPONSE_SUCCESS_CODE, RESPONSE_SUCCESS_MESSAGE } from "~/constants/response.constant";

export class ResOp<T = any> {
    @ApiProperty({
        type: 'object', additionalProperties: true
    })
    data?: T

    @ApiProperty({
        type: 'number', default: RESPONSE_SUCCESS_CODE
    })
    code?: number

    @ApiProperty({
        type: 'string', default: RESPONSE_SUCCESS_MESSAGE
    })
    message?: string

    constructor(code: number, data: T, message: string = RESPONSE_SUCCESS_MESSAGE) {
        this.data = data
        this.code = code
        this.message = message
    }

    static success<T>(data?: T, message?: string) {
        return new ResOp(RESPONSE_SUCCESS_CODE, data, message)
    }

    static error(code: number, message) {
        return new ResOp(code, {}, message)
    }
}
