import { ArgsType, Field } from '@nestjs/graphql';
import { Upload } from 'src/types';

@ArgsType()
export class CreateProfileArgs {
  @Field()
  firstName: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field(() => Upload, { nullable: true })
  upload?: Upload;
}
