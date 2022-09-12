import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class SignInArgs {
  @Field()
  email: string;

  @Field()
  password: string;
}
