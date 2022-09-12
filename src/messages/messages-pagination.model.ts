import { ObjectType } from '@nestjs/graphql';
import { Paginated } from 'src/types';
import { Message } from './message.model';

@ObjectType()
export class PaginatedMessages extends Paginated(Message) {}
