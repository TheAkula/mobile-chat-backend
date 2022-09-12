import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class Upload {
  @Field()
  base64: string;

  @Field()
  ext: string;
}
