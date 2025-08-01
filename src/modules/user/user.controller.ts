import { Body, Controller, Delete, Get, Param, ParseArrayPipe, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { ApiResult } from '~/common/decorators/api-result.decorator'
import { IdParam } from '~/common/decorators/id-param.decorator'
import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator'
import { definePermission, Perm } from '../auth/decorators/permission.decorator'
import { UserDto, UserQueryDto, UserUpdateDto } from './dto/user.dto'
import { UserEntity } from './user.entity'
import { UserService } from './user.service'
import { UserPasswordDto } from './dto/password.dto'

export const permissions = definePermission('system:user', {
  LIST: 'list',
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',

  PASSWORD_UPDATE: 'password:update',
  PASSWORD_RESET: 'pass:reset',
} as const)

@ApiTags('System - 用户模块')
@ApiSecurityAuth() // 在生成的 Swagger 文档中，这个 API 端点就会显示需要 auth 认证
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResult({ type: [UserEntity], isPage: true })
  @Perm(permissions.LIST)
  async list(@Query() dto: UserQueryDto) {
    return this.userService.list(dto)
  }

  @Get(':id')
  @ApiOperation({ summary: '查询用户' })
  @Perm(permissions.READ)
  async read(@IdParam() id: number) {
    return this.userService.info(id)
  }

  @Post()
  @ApiOperation({ summary: '新增用户' })
  @Perm(permissions.CREATE)
  async create(@Body() dto: UserDto): Promise<void> {
    await this.userService.create(dto)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户' })
  @Perm(permissions.UPDATE)
  async update(@IdParam() id: number, @Body() dto: UserUpdateDto): Promise<void> {
    await this.userService.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  @ApiParam({ name: 'id', type: String, schema: { oneOf: [{ type: 'string' }, { type: 'number' }] } })
  @Perm(permissions.DELETE)
  async delete(@Param('id', new ParseArrayPipe({ items: Number, separator: ',' })) ids: number[]): Promise<void> {
    await this.userService.delete(ids)
    await this.userService.multiForbidden(ids)
  }

  @Post(':id/password')
  @ApiOperation({ summary: '重置用户密码' })
  @Perm(permissions.PASSWORD_RESET)
  async resetPassword(@IdParam() id: number, @Body() dto: UserPasswordDto): Promise<void> {
    await this.userService.forceUpdatePassword(id, dto.password)
  }
}
