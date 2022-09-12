import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CounterResponse {
  @Field(() => Int)
  counter: number;
}
