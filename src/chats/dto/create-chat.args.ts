import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class CreateChatArgs {
  @Field()
  name: string;

  @Field({ nullable: true })
  image: string;

  @Field({ nullable: true })
  imageExt: string;
}
