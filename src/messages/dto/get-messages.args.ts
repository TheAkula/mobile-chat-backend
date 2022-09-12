import {
  ArgsType,
  Field,
  InputType,
  Int,
  registerEnumType,
} from '@nestjs/graphql';
import { OrderDirection } from 'src/enums';

export enum MessageOrderBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  title = 'title',
}

registerEnumType(MessageOrderBy, {
  name: 'MessageOrderBy',
});

@InputType()
export class MessagesFilter {
  @Field(() => MessageOrderBy, {
    nullable: true,
    defaultValue: MessageOrderBy.createdAt,
  })
  orderBy?: MessageOrderBy;

  @Field(() => OrderDirection, {
    defaultValue: OrderDirection.ASC,
    nullable: true,
  })
  orderDirection?: OrderDirection;

  @Field(() => Int, { defaultValue: 20, nullable: true })
  take?: number;
}

@ArgsType()
export class GetMessagesArgs {
  @Field()
  id: string;

  @Field({ nullable: true })
  filter?: MessagesFilter;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  skip: number;
}
