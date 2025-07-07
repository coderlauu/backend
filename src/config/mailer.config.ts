import { ConfigType, registerAs } from '@nestjs/config'
import { env, envOfNumber } from '~/global/env'

export const mailerKey = 'mailer'

export const MailerConfig = registerAs(mailerKey, () => {
  const port = envOfNumber('SMTP_PORT')

  return {
    host: env('SMTP_HOST'),
    port,
    // 根据端口自动配置加密方式
    secure: port === 465, // 465端口使用SSL
    auth: {
      user: env('SMTP_USER'),
      pass: env('SMTP_PASS'),
    },
  }
})

export type TMailerConfig = ConfigType<typeof MailerConfig>
