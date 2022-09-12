import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';

export interface IPaginated<T> {
  data: T[];
  nextPage?: number;
}

export function Paginated<T>(ref: T): Type<IPaginated<T>> {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedRef implements IPaginated<T> {
    @Field(() => [ref])
    data: T[];

    @Field(() => Int, { nullable: true })
    nextPage?: number;
  }

  return PaginatedRef as Type<IPaginated<T>>;
}
