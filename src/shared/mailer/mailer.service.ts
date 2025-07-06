import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { MailerService as NestMailerService } from '@nestjs-modules/mailer'
import { InjectRedis } from "~/common/decorators/inject-redis.decorator";
import { AppConfig, TAppConfig } from "~/config";
import { randomValue } from "~/utils";


@Injectable()
export class MailerService {
    constructor(
        @Inject(AppConfig.KEY) private readonly appConfig: TAppConfig,
        @InjectRedis() private readonly redis: Redis,
        private readonly mailerService: NestMailerService
    ) {}

    async log(to: string, code: string, ip: string) {

    }

    /**
     * 发送邮件
     * @param to 收件人
     * @param subject 邮件主题
     * @param content 邮件内容
     * @param type 邮件类型
     * @returns 
     */
    async send(to,subject,content: string,type: 'text' | 'html' = 'text') {
        if (type === 'text') {
            return this.mailerService.sendMail({
                to,
                subject,
                text: content
            })
        } else {
            return this.mailerService.sendMail({
                to,
                subject,
                html: content
            })
        }
    }

    async sendVerificationCode(to, code = randomValue(4, '1234567890')) {
        
    }
}