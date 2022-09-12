import { ObjectType } from '@nestjs/graphql';
import { Paginated } from 'src/types';
import { User } from './user.model';

@ObjectType()
export class PaginatedUsers extends Paginated(User) {}
