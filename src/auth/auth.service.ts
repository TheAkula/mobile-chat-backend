import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto/signin.dto';
import { AuthStatus } from 'src/users/user.model';
import { ValidateByEmailDto } from './dto/validateByEmail.dto';
import { UserWithAuth } from './auth.model';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<UserWithAuth> {
    const { firstName, lastName, password, email } = signUpDto;
    const user = await this.userService.findUserByEmail(email);
    if (user) {
      throw new UnauthorizedException(
        `User with email "${email}" already exists"`,
      );
    }

    const { salt, hash } = this.userService.createPassword(password);

    const newUser = await this.userService.createUser({
      salt,
      password: hash,
      firstName,
      lastName,
      email,
    });

    return {
      ...newUser,
      userToken: this.jwtService.sign({ id: newUser.id, email }),
    };
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.validateByEmail(signInDto);

    const payload = {
      id: user.id,
      email: user.email,
      is2faAuthenticated:
        user.authStatus !== AuthStatus.NotAuthenticated && user.is2faEnabled,
    };
    return {
      userToken: this.jwtService.sign(payload),
    };
  }

  async validateByEmail({ email, password }: ValidateByEmailDto) {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException(
        `User with email ${email} does not exist`,
      );
    }

    if (!this.userService.checkPassword(password, user.salt, user.password)) {
      throw new UnauthorizedException(`Password is wrong`);
    }
    return user;
  }
}
