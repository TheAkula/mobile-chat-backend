import {
  ArgsType,
  Field,
  InputType,
  Int,
  registerEnumType,
} from '@nestjs/graphql';
import { OrderDirection } from 'src/enums';

export enum UsersOrderBy {
  firstName = 'firstName',
  lastName = 'lastName',
}

registerEnumType(UsersOrderBy, {
  name: 'UsersOrderBy',
});

@InputType()
export class UsersFilter {
  @Field(() => UsersOrderBy, {
    defaultValue: UsersOrderBy.firstName,
    nullable: true,
  })
  orderBy?: UsersOrderBy;

  @Field(() => OrderDirection, {
    defaultValue: OrderDirection.ASC,
    nullable: true,
  })
  orderDirection?: OrderDirection;

  @Field(() => Int, { defaultValue: 30, nullable: true })
  take?: number;

  @Field(() => String, { nullable: true })
  name?: string;
}

@ArgsType()
export class GetUsersArgs {
  @Field(() => Int, { defaultValue: 0, nullable: true })
  page?: number;

  @Field(() => UsersFilter, { nullable: true })
  filter?: UsersFilter;

  @Field(() => Int, { defaultValue: 0, nullable: true })
  skip?: number;
}
