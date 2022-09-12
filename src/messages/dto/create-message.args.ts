import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class CreateMessageArgs {
  @Field()
  content: string;

  @Field()
  chatId: string;
}
