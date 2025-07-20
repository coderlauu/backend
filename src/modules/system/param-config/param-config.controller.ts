import { Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiResult } from '~/common/decorators/api-result.decorator'
import { IdParam } from '~/common/decorators/id-param.decorator'
import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator'
import { Pagination } from '~/helper/paginate/pagination'
import { ParamConfigDto, ParamConfigQueryDto } from './param-config.dto'
import { ParamConfigEntity } from './param-config.entity'
import { ParamConfigService } from './param-config.service'

@ApiTags('System - 参数配置模块')
@ApiSecurityAuth()
@Controller('param-config')
export class ParamConfigController {
  constructor(
    private readonly paramConfigService: ParamConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取参数配置列表' })
  @ApiResult({ type: [ParamConfigEntity], isPage: true })
  async list(@Query() dto: ParamConfigQueryDto): Promise<Pagination<ParamConfigEntity>> {
    return await this.paramConfigService.page(dto)
  }

  @Get(':id')
  @ApiOperation({ summary: '查询参数配置信息' })
  @ApiResult({ type: ParamConfigEntity })
  async info(@IdParam() id: number): Promise<ParamConfigEntity> {
    return await this.paramConfigService.info(id)
  }

  @Post()
  @ApiOperation({ summary: '新增参数配置' })
  async create(@Body() dto: ParamConfigDto): Promise<void> {
    await this.paramConfigService.create(dto)
  }

  @Put(':id')
  @ApiOperation({ summary: '修改参数配置' })
  async update(@IdParam() id: number, @Body() dto: ParamConfigDto): Promise<void> {
    await this.paramConfigService.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除参数配置' })
  async delete(@IdParam() id: number): Promise<void> {
    await this.paramConfigService.delete(id)
  }
}
