import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class UpdateUserArgs {
  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  avatarExt?: string;

  @Field({ nullable: true })
  password?: string;
}
