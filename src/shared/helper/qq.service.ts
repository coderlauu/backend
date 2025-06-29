import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class QQService {
    constructor(private readonly http: HttpService) {}

    async getNickname(qq: string | number) {
        const { data } = await this.http.axiosRef.get(
          `https://users.qzone.qq.com/fcg-bin/cgi_get_portrait.fcg?uins=${qq}`,
        )
        return data
      }
    
    async getAvatar(qq: string | number) {
    // https://thirdqq.qlogo.cn/headimg_dl?dst_uin=1743369777&spec=640&img_type=jpg
    return `https://thirdqq.qlogo.cn/g?b=qq&s=100&nk=${qq}`
    }
}