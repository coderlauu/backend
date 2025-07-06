import { Module } from "@nestjs/common";
import { MailerService, MailerModule as NestMailerModule } from '@nestjs-modules/mailer'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { ConfigModule, ConfigService } from "@nestjs/config";
import { appKey, ConfigKeyPaths, TAppConfig } from "~/config";
import { TMailerConfig, mailerKey } from "~/config/mailer.config";
import { join } from "node:path";


const providers = [MailerService]

@Module({
    imports: [
        NestMailerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService<ConfigKeyPaths>) => ({
                transport: configService.get<TMailerConfig>(mailerKey as any),
                defaults: {
                    from: configService.get<TAppConfig>(appKey).name,
                    address: configService.get<TMailerConfig>(mailerKey as any).auth.user,
                },
                template: {
                    dir: join(__dirname, '..', '..', '/assets/templates'),
                    adapter: new HandlebarsAdapter(),
                    options: {
                        strict: true
                    }
                }
            }),
            inject: [ConfigService]
        })
    ],
    providers,
    exports: providers
})
export class MailerModule {}