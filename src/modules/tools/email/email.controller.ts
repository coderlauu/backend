import { Body, Controller, Post } from '@nestjs/common'

import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { Ip } from '~/common/decorators/http.decorator'
import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator'

import { MailerService } from '~/shared/mailer/mailer.service'
import { EmailSendDto } from './email.dto'

@ApiTags('Tools - 邮箱模块')
@ApiSecurityAuth()
@Controller('email')
export class EmailController {
  constructor(private emailService: MailerService) {}

  @ApiOperation({ summary: '发送邮件' })
  @Post('send')
  async send(@Body() dto: EmailSendDto, @Ip() ip: string): Promise<void> {
    console.log('ip', ip)
    const { to, subject, content } = dto
    await this.emailService.send(to, subject, content, 'html', ip)
  }
}
