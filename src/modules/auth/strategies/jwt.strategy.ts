import { Inject, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthStrategy } from "../auth.constant";
import { SecurityConfig, TSecurityConfig } from "~/config/security.config";



@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, AuthStrategy.JWT) {
    constructor(
        @Inject(SecurityConfig.KEY) private readonly securityConfig: TSecurityConfig,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: securityConfig.jwtSecret
        })
    }

    async validate(payload: IAuthUser): Promise<IAuthUser> {
        return payload
    }
}