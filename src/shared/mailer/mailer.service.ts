import { MailerService as NestMailerService } from '@nestjs-modules/mailer'
import { Inject, Injectable } from '@nestjs/common'
import dayjs from 'dayjs'
import Redis from 'ioredis'
import { InjectRedis } from '~/common/decorators/inject-redis.decorator'
import { BusinessException } from '~/common/exceptions/biz.exception'
import { AppConfig, TAppConfig } from '~/config'
import { ErrorEnum } from '~/constants/error-code.constant'
import { randomValue } from '~/utils'

@Injectable()
export class MailerService {
  constructor(
        @Inject(AppConfig.KEY) private readonly appConfig: TAppConfig,
        @InjectRedis() private readonly redis: Redis,
        private readonly mailerService: NestMailerService,
  ) {}

  /**
   * 记录验证码发送日志
   * @param to 邮箱
   * @param code 验证码
   * @param ip 发送ip
   */
  async log(to: string, code: string, ip: string) {
    // 1. 计算距离当天结束还有多少秒
    const getRemainTime = () => {
      const now = dayjs()
      return now.endOf('day').diff(now, 'second')
    }

    // 2. 存储验证码，5分钟后过期
    await this.redis.set(`captcha:${to}`, code, 'EX', 60 * 5)

    // 3. 获取今天已发送的次数
    const limitCountOfDay = await this.redis.get(`captcha:${to}:limit-day`)
    const ipLimitCountOfDay = await this.redis.get(`ip:${ip}:send:limit-day`)

    // 4. 设置ip和邮箱的限制
    await this.redis.set(`ip:${ip}:send:limit`, 1, 'EX', 60)
    await this.redis.set(`captcha:${to}:limit`, 1, 'EX', 60)

    // 5. 更新今日发送计数，到当天结束时过期
    await this.redis.set(
      `captcha:${to}:send:limit-count-day`,
      limitCountOfDay,
      'EX',
      getRemainTime(),
    )
    await this.redis.set(
      `ip:${ip}:send:limit-count-day`,
      ipLimitCountOfDay,
      'EX',
      getRemainTime(),
    )
  }

  async checkCode(to, code) {
    const ret = await this.redis.get(`captcha:${to}`)
    if (ret !== code) {
      throw new BusinessException(ErrorEnum.INVALID_VERIFICATION_CODE)
    }

    await this.redis.del(`captcha:${to}`)
  }

  async checkLimit(to, ip) {
    const LIMIT_TIME = 5

    // ip限制
    const limitOfIp = await this.redis.get(`ip:${ip}:send:limit`)
    if (limitOfIp) {
      throw new BusinessException(ErrorEnum.TOO_MANY_REQUESTS)
    }

    // 1分钟最多接收1条
    const limit = await this.redis.get(`captcha:${to}:limit`)
    if (limit) {
      throw new BusinessException(ErrorEnum.TOO_MANY_REQUESTS)
    }

    // 1天一个邮箱最多接收5条
    let limitCountOfDay: string | number = await this.redis.get(`captcha:${to}:limit-day`)
    limitCountOfDay = Number(limitCountOfDay) || 0
    if (limitCountOfDay > LIMIT_TIME) {
      throw new BusinessException(ErrorEnum.MAXIMUM_FIVE_VERIFICATION_CODES_PER_DAY)
    }

    // 1天1个ip最多发送5条
    let ipLimitCountOfDay: string | number = await this.redis.get(`ip:${ip}:send:limit-day`)
    ipLimitCountOfDay = Number(ipLimitCountOfDay) || 0
    if (ipLimitCountOfDay > LIMIT_TIME) {
      throw new BusinessException(ErrorEnum.MAXIMUM_FIVE_VERIFICATION_CODES_PER_DAY)
    }
  }

  /**
   * 发送邮件
   * @param to 收件人
   * @param subject 邮件主题
   * @param content 邮件内容
   * @param type 邮件类型
   * @returns
   */
  async send(to, subject, content: string, type: 'text' | 'html' = 'text', ip: string) {
    await this.checkLimit(to, ip)

    if (type === 'text') {
      return this.mailerService.sendMail({
        to,
        subject,
        text: content,
      })
    }
    else {
      return this.mailerService.sendMail({
        to,
        subject,
        html: content,
      })
    }
  }

  async sendVerificationCode(to, code = randomValue(4, '1234567890')) {
    const subject = `[${this.appConfig.name}] 验证码`

    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template: './verification-code-zh',
        context: {
          code,
        },
      })
    }
    catch (error) {
      throw new BusinessException(ErrorEnum.VERIFICATION_CODE_SEND_FAILED)
    }

    return {
      to,
      code,
    }
  }
}
