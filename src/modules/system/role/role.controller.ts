import { BadRequestException, Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiResult } from '~/common/decorators/api-result.decorator'
import { IdParam } from '~/common/decorators/id-param.decorator'
import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator'
import { UpdaterPipe } from '~/common/pipes/updater.pipe'
import { ROOT_ROLE_ID } from '~/constants/system.constant'
import { Pagination } from '~/helper/paginate/pagination'
import { MenuService } from '../menu/menu.service'
import { RoleDto, RoleQueryDto, RoleUpdateDto } from './role.dto'
import { RoleEntity } from './role.entity'
import { RoleService } from './role.service'
import { definePermission, Perm } from '~/modules/auth/decorators/permission.decorator'

export const permissions = definePermission('system:role', {
  LIST: 'list',
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
} as const)

@ApiTags('System - 角色模块')
@ApiSecurityAuth()
@Controller('roles')
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly menuService: MenuService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取角色列表' })
  @ApiResult({ type: [RoleEntity], isPage: true })
  @Perm(permissions.LIST)
  async list(@Query() dto: RoleQueryDto): Promise<Pagination<RoleEntity>> {
    return await this.roleService.list(dto)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取角色详情' })
  @Perm(permissions.READ)
  async detail(@IdParam() id: number) {
    return this.roleService.detail(id)
  }

  @Post()
  @ApiOperation({ summary: '新增角色' })
  @Perm(permissions.CREATE)
  async create(@Body() dto: RoleDto): Promise<void> {
    await this.roleService.create(dto)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新角色' })
  @Perm(permissions.UPDATE)
  async update(@IdParam() id: number, @Body(UpdaterPipe) dto: RoleUpdateDto): Promise<void> {
    await this.roleService.update(id, dto)
    // 刷新所有在线用户的权限
    await this.menuService.refreshAllOnlineUserPermissions(false)
    /**
     * 为什么需要这一步？
     * 前端页面的菜单栏、按钮权限需要实时更新
     * 避免用户需要刷新页面才能看到权限变化
     */
    // this.sseService.noticeClientToUpdateMenusByRoleIds([id]) // 通知前端更新菜单权限
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  @Perm(permissions.DELETE)
  async delete(@IdParam() id: number): Promise<void> {
    // 超级管理员不能删除
    if (id === ROOT_ROLE_ID) {
      throw new BadRequestException('超级管理员不能删除')
    }

    if (await this.roleService.checkUserByRoleId(id)) {
      throw new BadRequestException('该角色已被用户关联，无法删除')
    }

    await this.roleService.delete(id)
    // 刷新所有在线用户的权限
    await this.menuService.refreshAllOnlineUserPermissions(false)
    // this.sseService.noticeClientToUpdateMenusByRoleIds([id]) // 通知前端更新菜单权限
  }
}
