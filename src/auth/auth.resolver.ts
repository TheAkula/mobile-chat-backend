import { UseGuards } from '@nestjs/common';
import { Resolver, Mutation, Args, Int } from '@nestjs/graphql';
import { User } from 'src/users/user.model';
import { TwoFactorAuthenticationService } from './2f-auth.service';
import { Auth, TwoFactorAuth, UserWithAuth } from './auth.model';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { Resend2faCodeArgs } from './dto/resend-2facode.args';
import { SignInArgs as SignInArgsType } from './dto/signin.args';
import { SignUpArgs } from './dto/signup.args';
import { JwtGuard } from './jwt.guard';
import { LocalAuthGuard } from './local-auth.guard';
import { CounterResponse } from './types';

@Resolver()
export class AuthResolver {
  constructor(
    private authService: AuthService,
    private twofaService: TwoFactorAuthenticationService,
  ) {}

  @Mutation(() => UserWithAuth)
  async signUp(@Args() args: SignUpArgs): Promise<UserWithAuth> {
    return this.authService.signUp(args);
  }

  @UseGuards(LocalAuthGuard)
  @Mutation(() => Auth)
  async login(@Args() args: SignInArgsType) {
    return this.authService.signIn(args);
  }

  @Mutation(() => TwoFactorAuth)
  async signUpWith2fa(@Args('email') email: string): Promise<TwoFactorAuth> {
    return this.twofaService.signUpWith2fa(email);
  }

  @UseGuards(JwtGuard)
  @Mutation(() => UserWithAuth)
  confirmSignUpWith2fa(
    @Args('code', { type: () => Int }) code: number,
    @Args('counter', { type: () => Int }) counter: number,
    @CurrentUser() user: User,
  ): Promise<UserWithAuth> {
    return this.twofaService.verify2faCode(code, user.id, counter);
  }

  @UseGuards(JwtGuard)
  @Mutation(() => CounterResponse)
  resend2faCode(
    @Args() resend2faCode: Resend2faCodeArgs,
    @CurrentUser() user: User,
  ): Promise<CounterResponse> {
    return this.twofaService.resend2faCode(resend2faCode.counter, user);
  }
}
