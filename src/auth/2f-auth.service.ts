import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hotp, authenticator } from 'otplib';
import { AuthStatus, User } from 'src/users/user.model';
import { UsersService } from 'src/users/users.service';
import { Auth, TwoFactorAuth, UserWithAuth } from './auth.model';
import { CounterResponse } from './types';

@Injectable()
export class TwoFactorAuthenticationService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async generateTwoFactorAuthenticationSecret(user: User) {
    const secret = authenticator.generateSecret();
    const counter = 0;

    await this.usersService.setTwoFactorAuthenticationSecret(secret, user.id);

    const code = hotp.generate(secret, counter);

    return {
      secret,
      code,
    };
  }

  async resend2faCode(counter: number, user: User): Promise<CounterResponse> {
    const code = hotp.generate(user.twoFactorAuthenticationSecret, counter + 1);

    await this.mailerService.sendMail({
      to: user.email,
      from: this.configService.get('SERVER_MAILER_EMAIL'),
      subject: 'Signup code',
      text: 'Your code ' + code,
    });

    return {
      counter: counter + 1,
    };
  }

  async verify2faCode(
    code: number,
    userId: string,
    counter: number,
  ): Promise<UserWithAuth> {
    const user = await this.usersService.findUserById(userId);

    const valid = hotp.verify({
      token: code.toString(),
      secret: user.twoFactorAuthenticationSecret,
      counter: counter,
    });

    if (valid) {
      const token = this.jwtService.sign({
        id: user.id,
        email: user.email,
        is2faAuthenticated: true,
      });

      await this.usersService.authenticateUser(user.id);

      return {
        ...user,
        userToken: token,
      };
    }

    throw new UnauthorizedException('Invalid code');
  }

  async signUpWith2fa(email: string): Promise<TwoFactorAuth> {
    const exUser = await this.usersService.findUserByEmail(email);
    let user: User;

    if (
      exUser &&
      exUser.is2faEnabled &&
      (exUser.authStatus === AuthStatus.NotAuthenticated ||
        exUser.authStatus === AuthStatus.Authenticated)
    ) {
      user = exUser;
    } else if (exUser && exUser.is2faEnabled) {
      throw new BadRequestException(`User with email ${email} already exist`);
    } else if (!exUser) {
      user = await this.usersService.createUserWith2fa(email);
    }

    const { code } = await this.generateTwoFactorAuthenticationSecret(user);

    try {
      await this.mailerService.sendMail({
        to: user.email,
        from: this.configService.get('SERVER_MAILER_EMAIL'),
        subject: 'Signup code',
        text: 'Your code ' + code,
      });

      return {
        userToken: this.jwtService.sign({
          id: user.id,
          email,
          is2faAuthenticated: false,
        }),
        counter: 0,
      };
    } catch (err) {}
  }
}
