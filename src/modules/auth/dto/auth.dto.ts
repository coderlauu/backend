import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";



export class LoginDto {
    @ApiProperty({ description: '用户名/邮箱/手机' })
    @IsString()
    @MinLength(4)
    username: string

    @ApiProperty({ description: '密码' })
    @IsString()
    @MinLength(6)
    @Matches(/^\S*(?=\S{6})(?=\S*\d)(?=\S*[A-Z])\S*$/i, {
        message: '密码必须包含数字、字母，长度为6-16'
    })
    password: string

    @ApiProperty({ description: '验证码标识' })
    @IsString()
    captchaId: string

    @ApiProperty({ description: '验证码' })
    @IsString()
    @MinLength(4)
    @MaxLength(4)
    verifyCode: string
}

export class RegisterDto {
    @ApiProperty({ description: '用户名' })
    @IsString()
    username: string

    @ApiProperty({ description: '密码' })
    @IsString()
    @Matches(/^\S*(?=\S{6})(?=\S*\d)(?=\S*[A-Z])\S*$/i, {
        message: '密码必须包含数字、字母，长度为6-16'
    })
    @MinLength(6)
    @MaxLength(16)
    password: string

    @ApiProperty({ description: '语言', examples: ['EN', 'ZH'] })
    @IsString()
    @IsOptional()
    lang?: string
}