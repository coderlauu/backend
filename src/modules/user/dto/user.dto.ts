import { ApiProperty, IntersectionType, PartialType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, ArrayNotEmpty, IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator'
import { isEmpty } from 'lodash'
import { PagerDto } from '~/common/dto/pager.dto'

export class UserDto {
  @ApiProperty({ description: '头像' })
  @IsOptional() // 可选
  @IsString()
  avatar?: string

  @ApiProperty({ description: '登录账号', example: 'admin' })
  @IsString()
  @Matches(/^[\s\S]+$/)
  @MinLength(4)
  @MaxLength(20)
  username: string

  @ApiProperty({ description: '登录密码', example: 'a123456' })
  @IsNotEmpty()
  @Matches(/^\S*(?=\S{6})(?=\S*\d)(?=\S*[A-Z])\S*$/i, {
    message: '密码必须包含数字、字母，长度为6-16',
  })
  password: string

  @ApiProperty({ description: '归属角色', type: [Number] })
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  roleIds: number[]

  @ApiProperty({ description: '所属部门', type: Number })
  /**
   * 补充： 如果请求参数传的是嵌套的对象数组，则可以结合这个装饰器来校验对象中的每个key是否符合要求
   * 例如：以下代码，可以校验metaOptions中的name和value是否符合要求
   * @ValidateNested({ each: true })
   * @Type(() => xxxOptionsDto)
   * metaOptions: xxxOptionsDto[]
   *
   * xxxOptionsDto {
   *  name: string,
   *  value: string
   * }
   */
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  deptId?: number

  @ApiProperty({ description: '昵称', example: 'admin' })
  @IsOptional()
  @IsString()
  nickname: string

  @ApiProperty({ description: '邮箱', example: '1552951291@qq.com' })
  @IsEmail()
  @ValidateIf(o => !isEmpty(o.email)) // 条件验证：只有当邮箱字段不为空时才进行验证w
  email: string

  @ApiProperty({ description: '手机号', example: '1552951291' })
  @IsOptional()
  @IsString()
  phone?: string

  @ApiProperty({ description: 'QQ号', example: '1552951291' })
  @IsOptional()
  @IsString()
  @Matches(/^[1-9]\d{4,10}$/)
  @MinLength(5)
  @MaxLength(11)
  qq?: string

  @ApiProperty({ description: '描述' })
  @IsOptional()
  @IsString()
  remark?: string

  @ApiProperty({ description: '状态' })
  @IsIn([0, 1])
  status: number
}

export class UserUpdateDto extends PartialType(UserDto) {}

export class UserQueryDto extends IntersectionType(PagerDto<UserDto>, PartialType(UserDto)) {
  @ApiProperty({ description: '登录账号', example: 'admin', required: false })
  @IsString()
  @IsOptional()
  username?: string

  @ApiProperty({ description: '归属大区', example: 1, required: false })
  @IsInt()
  @IsOptional()
  deptId?: number

  @ApiProperty({ description: '状态', example: 0, required: false })
  @IsInt()
  @IsOptional()
  status?: number
}
