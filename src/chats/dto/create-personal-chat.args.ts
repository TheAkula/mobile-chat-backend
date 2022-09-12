import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class CreatePersonalChatArgs {
  @Field()
  id: string;
}
