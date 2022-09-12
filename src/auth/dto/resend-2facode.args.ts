import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class Resend2faCodeArgs {
  @Field(() => Int)
  counter: number;
}
