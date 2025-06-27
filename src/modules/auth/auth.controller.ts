import { Body, Controller, Post, Headers } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { LoginDto, RegisterDto } from './dto/auth.dto'
import { AuthService } from './auth.service'
import { UserService } from '../user/user.service'
import { Public } from './decorators/public.decorator'
import { Ip } from '~/common/decorators/http.decorator'
import { CaptchaService } from './services/captcha.service'
import { LoginToken } from './models/auth.model'
import { ApiResult } from '~/common/decorators/api-result.decorator'

@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService, 
    private readonly authService: AuthService,
    private readonly captchaService: CaptchaService
  ) {}

  @Post('register')
  @ApiOperation({ summary: '注册' })
  async register(@Body() dto: RegisterDto): Promise<void> {
    await this.userService.register(dto)
  }

  @Post('login')
  @ApiOperation({ summary: '登录' })
  @ApiResult({ type: LoginToken })
  async login(@Body() dto: LoginDto, @Ip() ip: string, @Headers('user-agent') ua: string): Promise<LoginToken> {
    await this.captchaService.checkImgCaptcha(dto.captchaId, dto.verifyCode)
    const token = await this.authService.login(dto.username, dto.password, ip, ua)
    
    return { token }
  }
}
