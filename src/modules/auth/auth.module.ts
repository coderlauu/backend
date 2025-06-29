import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { securityKey, TSecurityConfig } from '~/config/security.config'
import { isDev } from '~/global/env'
import { LogModule } from '../system/log/log.module'
import { RoleModule } from '../system/role/role.module'
import { UserModule } from '../user/user.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { CaptchaController } from './controllers/captcha.controller'
import { AccessTokenEntity } from './entities/access-token.entity'
import { RefreshTokenEntity } from './entities/refresh-token.entity'
import { CaptchaService } from './services/captcha.service'
import { TokenService } from './services/token.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { AccountController } from './controllers/account.controller';

const providers = [AuthService, TokenService, CaptchaService]
const strategies = [JwtStrategy]

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
            expiresIn: `${jwtExpire}s`,
          },
          ignoreExpiration: isDev,
        }
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, CaptchaController, AccountController],
  providers: [...providers, ...strategies],
  exports: [...providers],
})
export class AuthModule {}
