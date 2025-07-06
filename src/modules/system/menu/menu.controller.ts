import { BadRequestException, Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiResult } from '~/common/decorators/api-result.decorator'
import { IdParam } from '~/common/decorators/id-param.decorator'
import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator'
import { MenuDto, MenuQueryDto, MenuUpdateDto } from './menu.dto'
import { MenuItemInfo } from './menu.model'
import { MenuService } from './menu.service'
import { UpdaterPipe } from '~/common/pipes/updater.pipe'
import { flattenDeep } from 'lodash'
import { definePermission, getDefinePermissions, Perm } from '~/modules/auth/decorators/permission.decorator'
import { CreatorPipe } from '~/common/pipes/creator.pipe'

export const permissions = definePermission('system:menu', {
    LIST: 'list',
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
  } as const)

@ApiTags('System - 菜单模块')
@ApiSecurityAuth()
@Controller('menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: '获取所有菜单列表' })
  @ApiResult({ type: [MenuItemInfo] })
  @Perm(permissions.LIST)
  async list(@Query() dto: MenuQueryDto) {
    return this.menuService.list(dto)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取菜单详情' })
  @ApiResult({ type: MenuItemInfo })
  @Perm(permissions.READ)
  async detail(@IdParam() id: number) {
    return this.menuService.detail(id)
  }
  
  @Post()
  @ApiOperation({ summary: '新增菜单或权限' })
  @Perm(permissions.CREATE)
  async create(@Body(CreatorPipe) dto: MenuDto): Promise<void> {
    await this.menuService.check(dto)

    // 根目录
    if (!dto.parentId) {
        dto.parentId = null    
    }

    await this.menuService.create(dto)
    if (dto.type === 2) {
        // 如果是权限发生更改，则刷新所有在线用户的权限
        await this.menuService.refreshAllOnlineUserPermissions()
    }
  }

  @Put(':id')
  @ApiOperation({ summary: '更新菜单或权限' })
  @Perm(permissions.UPDATE)
  async update(@IdParam() id: number, @Body(UpdaterPipe) dto: MenuUpdateDto): Promise<void> {
    await this.menuService.check(dto)
    if (dto.parentId === -1 || !dto.parentId) {
        dto.parentId = null
    }

    await this.menuService.update(id, dto)
    if (dto.type === 2) {
        // 如果是权限发生更改，则刷新所有在线用户的权限
        await this.menuService.refreshAllOnlineUserPermissions()
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除菜单或权限' })
  @Perm(permissions.DELETE)
  async delete(@IdParam() id: number): Promise<void> {
    if (await this.menuService.checkRoleByMenuId(id)) {
        throw new BadRequestException('该菜单已被角色关联，无法删除')
    }

    // 查出当前菜单下的子目录/子菜单/权限
    const childMenuIds = await this.menuService.findChildMenus(id)
    await this.menuService.delete(flattenDeep([id, childMenuIds]))
    // 刷新所有在线用户的权限
    await this.menuService.refreshAllOnlineUserPermissions()
  }
  
  @Get('permissions')
  @ApiOperation({ summary: '获取后端定义的所有权限集' })
  async getPermissions(): Promise<string[]> {
    return getDefinePermissions()
  }
}
