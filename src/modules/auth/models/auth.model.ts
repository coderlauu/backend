import { ApiProperty } from "@nestjs/swagger";





export class LoginToken {
    @ApiProperty({ description: 'JWT身份Token' })
    token: string
}