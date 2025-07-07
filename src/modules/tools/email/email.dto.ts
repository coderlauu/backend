import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class EmailSendDto {
  @ApiProperty({ description: '收件人邮箱' })
  @IsEmail()
  @IsNotEmpty()
  to: string

  @ApiProperty({ description: '邮件主题' })
  @IsString()
  @IsNotEmpty()
  subject: string

  @ApiProperty({ description: '邮件内容' })
  @IsString()
  @IsNotEmpty()
  content: string
}
