import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";



export class AccountUpdateDto {
    @ApiProperty({ description: '用户名' })
    @IsString()
    @IsOptional()
    nickname: string

    @ApiProperty({ description: '用户邮箱' })
    @IsOptional()
    @IsEmail()
    email: string

    @ApiProperty({ description: 'QQ' })
    @IsOptional()
    @IsString()
    @Matches(/^\d+$/)
    @MinLength(5)
    @MaxLength(11)
    qq: string

    @ApiProperty({ description: '手机号' })
    @IsOptional()
    @IsString()
    phone: string

    @ApiProperty({ description: '头像' })
    @IsOptional()
    @IsString()
    avatar: string

    @ApiProperty({ description: '备注' })
    @IsOptional()
    @IsString()
    remark: string
}