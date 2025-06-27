import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { securityKey, TSecurityConfig } from '~/config/security.config'
import { isDev } from '~/global/env'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AccessTokenEntity } from './entities/access-token.entity'
import { RefreshTokenEntity } from './entities/refresh-token.entity'
import { UserModule } from '../user/user.module'
import { RoleModule } from '../system/role/role.module'
import { LogModule } from '../system/log/log.module'
import { TokenService } from './services/token.service'
import { CaptchaService } from './services/captcha.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([AccessTokenEntity, RefreshTokenEntity]),
    UserModule,
    RoleModule,
    PassportModule,
    LogModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const { jwtSecret, jwtExpire } = configService.get<TSecurityConfig>(securityKey)

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: jwtExpire,
          },
          ignoreExpiration: isDev,
        }
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, CaptchaService],
  exports: [AuthService]
})
export class AuthModule {}
