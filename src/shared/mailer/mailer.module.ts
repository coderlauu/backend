import { join } from 'node:path'
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { appKey, ConfigKeyPaths, TAppConfig } from '~/config'
import { mailerKey, TMailerConfig } from '~/config/mailer.config'
import { MailerService } from './mailer.service'

const providers = [MailerService]

@Module({
  imports: [
    NestMailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => ({
        transport: configService.get<TMailerConfig>(mailerKey as any),
        defaults: {
          from: {
            name: configService.get<TAppConfig>(appKey).name,
            address: configService.get<TMailerConfig>(mailerKey as any).auth.user,
          },
        },
        // template: {
        //   dir: join(__dirname, '..', '..', '/assets/templates'),
        //   adapter: new HandlebarsAdapter(),
        //   options: {
        //     strict: true,
        //   },
        // },
      }),
      inject: [ConfigService],
    }),
  ],
  providers,
  exports: providers,
})
export class MailerModule {}
