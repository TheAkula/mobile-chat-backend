import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      usernameField: 'email',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findUserById(payload.id);
    if (!user) {
      throw new UnauthorizedException(
        `User with id "${payload.id} does not exist"`,
      );
    }

    return user;
  }
}
