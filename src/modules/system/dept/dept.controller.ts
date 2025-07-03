import { Body, Controller, Delete, Get, Post, Put, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { IdParam } from "~/common/decorators/id-param.decorator";
import { ApiSecurityAuth } from "~/common/decorators/swagger.decorator";
import { DeptDto, DeptQueryDto } from "./dept.dto";
import { DeptEntity } from "./dept.entity";
import { DeptService } from "./dept.service";
import { ApiResult } from "~/common/decorators/api-result.decorator";
import { AuthUser } from "~/modules/auth/decorators/auth-user.decorator";



@Controller('depts')
@ApiTags('System - 部门模块')
@ApiSecurityAuth()
export class DeptController {
    constructor(private readonly deptService: DeptService) {}

    @Get()
    @ApiOperation({ summary: '部门列表' })
    @ApiResult({ type: [DeptEntity] })
    async list(@Query() dto: DeptQueryDto, @AuthUser('uid') uid: number): Promise<DeptEntity[]> {
        return await this.deptService.list(dto, uid)
    }

    @Post()
    @ApiOperation({ summary: '新增部门' })
    async create(@Body() dto: DeptDto): Promise<void> {
        await this.deptService.create(dto)
    }

    @Put(':id')
    @ApiOperation({ summary: '修改部门' })
    async update(@IdParam() id: number, @Body() dto: DeptDto): Promise<void> {
        await this.deptService.update(id, dto)
    }

    // @Delete(':id')
    // @ApiOperation({ summary: '删除部门' })
    // async delete(@IdParam() id: number): Promise<void> {
    //     await this.deptService.delete(id)
    // }

}