import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class ChatsFilter {
  @Field(() => Int, { nullable: true })
  messagesAmount?: number;
}
