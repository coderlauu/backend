import { Body, Controller, Post, Put } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserDto } from './dto/user.dto'
import { UserService } from './user.service'

@ApiTags('System - 用户模块')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: '新增用户' })
  async create(@Body() dto: UserDto): Promise<void> {
    // await this.userService.create(dto)
  }
}
