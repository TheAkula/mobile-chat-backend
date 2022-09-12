import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class SignUpArgs {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field()
  password: string;
}
