import { Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiResult } from '~/common/decorators/api-result.decorator'
import { IdParam } from '~/common/decorators/id-param.decorator'
import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator'
import { BusinessException } from '~/common/exceptions/biz.exception'
import { UpdaterPipe } from '~/common/pipes/updater.pipe'
import { ErrorEnum } from '~/constants/error-code.constant'
import { AuthUser } from '~/modules/auth/decorators/auth-user.decorator'
import { DeptDto, DeptQueryDto } from './dept.dto'
import { DeptEntity } from './dept.entity'
import { DeptService } from './dept.service'
import { definePermission, Perm } from '~/modules/auth/decorators/permission.decorator'

export const permissions = definePermission('system:dept', {
  LIST: 'list',
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
} as const)

@Controller('depts')
@ApiTags('System - 部门模块')
@ApiSecurityAuth()
export class DeptController {
  constructor(private readonly deptService: DeptService) {}

  @Get()
  @ApiOperation({ summary: '部门列表' })
  @ApiResult({ type: [DeptEntity] })
  @Perm(permissions.LIST)
  async list(@Query() dto: DeptQueryDto, @AuthUser('uid') uid: number): Promise<DeptEntity[]> {
    return await this.deptService.list(dto, uid)
  }

  @Post()
  @ApiOperation({ summary: '新增部门' })
  @Perm(permissions.CREATE)
  async create(@Body() dto: DeptDto): Promise<void> {
    await this.deptService.create(dto)
  }

  @Put(':id')
  @ApiOperation({ summary: '修改部门' })
  @Perm(permissions.UPDATE)
  async update(@IdParam() id: number, @Body(UpdaterPipe) dto: DeptDto): Promise<void> {
    await this.deptService.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除部门' })
  @Perm(permissions.DELETE)
  async delete(@IdParam() id: number): Promise<void> {
    /**
     * 如果部门下还有用户，不能删除
     * 如果部门下还有子部门，不能删除
     */
    const userCountForDept = await this.deptService.countUserByDeptId(id)

    if (userCountForDept > 0) {
      throw new BusinessException(ErrorEnum.DEPARTMENT_HAS_ASSOCIATED_USERS)
    }

    const childDeptCount = await this.deptService.countChildDept(id)

    if (childDeptCount > 0) {
      throw new BusinessException(ErrorEnum.DEPARTMENT_HAS_CHILD_DEPARTMENTS)
    }

    await this.deptService.delete(id)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取部门详情' })
  @Perm(permissions.READ)
  async info(@IdParam() id: number): Promise<DeptEntity> {
    return await this.deptService.info(id)
  }
}
