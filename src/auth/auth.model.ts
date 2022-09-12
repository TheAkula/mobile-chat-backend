import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User } from 'src/users/user.model';

@ObjectType()
export class Auth {
  @Field()
  userToken: string;
}

@ObjectType()
export class TwoFactorAuth {
  @Field()
  userToken: string;

  @Field(() => Int)
  counter: number;
}

@ObjectType()
export class UserWithAuth extends User {
  @Field()
  userToken: string;
}
