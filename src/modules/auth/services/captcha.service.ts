import { Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { isEmpty, result } from "lodash";
import { InjectRedis } from "~/common/decorators/inject-redis.decorator";
import { BusinessException } from "~/common/exceptions/biz.exception";
import { ErrorEnum } from "~/constants/error-code.constant";
import { genCaptchaImgKey } from "~/helper/genRedisKey";



@Injectable()
export class CaptchaService {
    constructor(
        @InjectRedis() private readonly redis: Redis
    ) {}

    /**
     * 验证图片验证码
     * @param id 验证码id
     * @param code 验证码
     */
    async checkImgCaptcha(id: string, code: string): Promise<void> {
        const captcha = await this.redis.get(genCaptchaImgKey(id))
        if (isEmpty(captcha) || captcha.toLocaleLowerCase() !== code.toLocaleLowerCase()) {
            throw new BusinessException(ErrorEnum.INVALID_VERIFICATION_CODE)
        }

        // 验证成功后，删除验证码
        await this.redis.del(genCaptchaImgKey(id))
    }
}