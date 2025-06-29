import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiResult } from '~/common/decorators/api-result.decorator'
import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator'
import { UserDto, UserQueryDto } from './dto/user.dto'
import { UserEntity } from './user.entity'
import { UserService } from './user.service'
import { IdParam } from '~/common/decorators/id-param.decorator'

@ApiTags('System - 用户模块')
@ApiSecurityAuth() // 在生成的 Swagger 文档中，这个 API 端点就会显示需要 auth 认证
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResult({ type: [UserEntity], isPage: true })
  async list(@Query() dto: UserQueryDto) {
    return this.userService.list(dto)
  }

  @Get(':id')
  @ApiOperation({ summary: '查询用户' })
  async read(@IdParam() id: number) {
    return this.userService.info(id)
  }

  @Post()
  @ApiOperation({ summary: '新增用户' })
  async create(@Body() dto: UserDto): Promise<void> {
    // await this.userService.create(dto)
  }
}
