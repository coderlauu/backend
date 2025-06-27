import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { getIpAddress } from "~/utils/ip.util";
import { LoginLogEntity } from "../entities/login-log.entity";
import { Repository } from "typeorm";




@Injectable()
export class LoginLogService {
    private readonly logger = new Logger(LoginLogService.name)

    constructor(
        @InjectRepository(LoginLogEntity)
        private readonly loginLogRepo: Repository<LoginLogEntity>
    ) {}


    async create(uid: number, ip: string, ua: string) {
        try {
            const address = await getIpAddress(ip)

            await this.loginLogRepo.save({
                ip,
                ua,
                address,
                user: {
                    id: uid
                }
            })
        } catch (error) {
            this.logger.error(error)
        }
    }
}