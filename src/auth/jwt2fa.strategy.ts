import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Jwt2faStrategy extends PassportStrategy(
  Strategy,
  'jwt-two-factor',
) {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findUserById(payload.id);

    if (!user) {
      throw new UnauthorizedException();
    }
    if (!user.is2faEnabled) {
      return user;
    }
    if (payload.is2faAuthenticated) {
      return user;
    }
  }
}
