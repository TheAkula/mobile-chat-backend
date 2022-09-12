import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthLocalStrategy } from './auth-local.strategy';
import { TwoFactorAuthenticationService } from './2f-auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Jwt2faStrategy } from './jwt2fa.strategy';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '10d',
        },
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    AuthResolver,
    Jwt2faStrategy,
    AuthLocalStrategy,
    TwoFactorAuthenticationService,
    JwtStrategy,
  ],
  exports: [AuthService, TwoFactorAuthenticationService],
})
export class AuthModule {}
