import { ConfigType, registerAs } from "@nestjs/config"
import { register } from "module"
import { env, envOfNumber } from "~/global/env"


export const mailerKey = 'mailer'

export const MailerConfig = registerAs(mailerKey, () => ({
    host: env('SMTP_HOST'),
    port: envOfNumber('SMTP_PORT'),
    ignoreTLS: true,
    secure: true,
    auth: {
        user: env('SMTP_USER'),
        pass: env('SMTP_PASS')
    }
}))

export type TMailerConfig = ConfigType<typeof MailerConfig>