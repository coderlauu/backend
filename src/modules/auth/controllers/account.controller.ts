import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { ApiResult } from '~/common/decorators/api-result.decorator';
import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator';
import { AccountInfo } from '~/modules/user/user.model';
import { AllowAnon } from '../decorators/allow-anon.decorator';
import { AuthUser } from '../decorators/auth-user.decorator';
import { UserService } from '~/modules/user/user.service';
import type { FastifyRequest } from 'fastify';
import { AuthService } from '../auth.service';
import { AccountMenus, AccountUpdateDto } from '../dto/account.dto';
import { RouteRecordRaw } from '~/utils/permission.util';

@ApiTags('Account - 账户模块')
@ApiSecurityAuth()
@Controller('account')
export class AccountController {
    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService
    ) {}

    @Get('profile')
    @ApiOperation({ summary: '获取用户信息' })
    @ApiResult({ type: AccountInfo })
    @AllowAnon()
    async profile(@AuthUser() user: IAuthUser): Promise<AccountInfo> {
        return await this.userService.getAccountInfo(user.uid)
    }

    @Get('logout')
    @ApiOperation({ summary: '账户登出' })
    @AllowAnon()
    async logout(@AuthUser() user: IAuthUser, @Req() req: FastifyRequest): Promise<void> {
        await this.authService.clearLoginStatus(user, req.accessToken)
    }

    @Put('update')
    @ApiOperation({ summary: '更改账户资料' })
    @AllowAnon()
    async update(@AuthUser() user: IAuthUser, @Body() dto: AccountUpdateDto): Promise<void> {
        await this.userService.updateAccountInfo(user.uid, dto)
    }

    @Get('menus')
    @ApiOperation({ summary: '获取用户菜单' })
    @ApiResult({ type: [AccountMenus] })
    @AllowAnon()
    async menus(@AuthUser() user: IAuthUser) {
        return await this.authService.getMenus(user.uid)
    }

    @Get('permissions')
    @ApiOperation({ summary: '获取用户权限' })
    @ApiResult({ type: [String] })
    @AllowAnon()
    async permissions(@AuthUser() user: IAuthUser): Promise<string[]> {
        return await this.authService.getPermissions(user.uid)
    }
}


