import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResult } from '~/common/decorators/api-result.decorator';
import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator';
import { MenuItemInfo } from './menu.model';
import { MenuQueryDto } from './menu.dto';

@ApiTags('Menu - 菜单模块')
@ApiSecurityAuth()
@Controller('menus')
export class MenuController {

    @Get()
    @ApiOperation({ summary: '获取所有菜单列表' })
    @ApiResult({ type: [MenuItemInfo] })
    async list(@Query() dto: MenuQueryDto) {

    }
}
