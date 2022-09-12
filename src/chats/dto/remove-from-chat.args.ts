import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class RemoveFromChatArgs {
  @Field()
  userId: string;

  @Field()
  chatId: string;
}
