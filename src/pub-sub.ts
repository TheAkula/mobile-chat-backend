import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

@Injectable()
export class PubSubProvider extends PubSub {
  constructor() {
    super();
  }
}
