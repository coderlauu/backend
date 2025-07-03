import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiResult } from '~/common/decorators/api-result.decorator'
import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator'
import { Pagination } from '~/helper/paginate/Pagination'
import { RoleQueryDto } from './role.dto'
import { RoleEntity } from './role.entity'
import { RoleService } from './role.service'

@ApiTags('System - 角色模块')
@ApiSecurityAuth()
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ApiOperation({ summary: '获取角色列表' })
  @ApiResult({ type: [RoleEntity], isPage: true })
  async list(@Query() dto: RoleQueryDto): Promise<Pagination<RoleEntity>> {
    return await this.roleService.list(dto)
  }
}
