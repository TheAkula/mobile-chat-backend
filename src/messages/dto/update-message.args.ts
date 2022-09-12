import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class UpdateMessageArgs {
  @Field({ nullable: true })
  content?: string;

  @Field({ nullable: true })
  messageId: string;
}
