import { ArgsType, Field } from '@nestjs/graphql';
import { ChatsFilter } from '../chats-filter.input';

@ArgsType()
export class GetChatsArgs {
  @Field({ nullable: true })
  filter: ChatsFilter;
}
