import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class CreatePasswordArgs {
  @Field()
  password: string;
}
