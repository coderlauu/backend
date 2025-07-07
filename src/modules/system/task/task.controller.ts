import { Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { ApiResult } from '~/common/decorators/api-result.decorator'
import { IdParam } from '~/common/decorators/id-param.decorator'
import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator'
import { Pagination } from '~/helper/paginate/pagination'
import { definePermission, Perm } from '~/modules/auth/decorators/permission.decorator'
import { TaskEntity } from '~/modules/system/task/task.entity'

import { TaskDto, TaskQueryDto, TaskUpdateDto } from './task.dto'
import { TaskService } from './task.service'

export const permissions = definePermission('system:task', {
  LIST: 'list',
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',

  ONCE: 'once',
  START: 'start',
  STOP: 'stop',
} as const)

@ApiTags('System - 任务调度模块')
@ApiSecurityAuth()
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async create(@Body() dto: TaskDto) {
    const [service, method] = dto.service.split('.')
    await this.taskService.checkHasMissionMeta(service, method)
  }
}
