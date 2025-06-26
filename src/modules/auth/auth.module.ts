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

@Module({
  imports: [
    TypeOrmModule.forFeature([AccessTokenEntity, RefreshTokenEntity]),
    PassportModule,
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
  providers: [AuthService],
})
export class AuthModule {}
