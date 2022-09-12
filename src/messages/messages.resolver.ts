import { UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Jwt2faGuard } from 'src/auth/jwt2fa.guard';
import { PubSubTrigger } from 'src/enums';
import { PubSubProvider } from 'src/pub-sub';
import { IPaginated } from 'src/types';
import { User } from 'src/users/user.model';
import { CreateMessageArgs } from './dto/create-message.args';
import { GetMessagesArgs } from './dto/get-messages.args';
import { UpdateMessageArgs } from './dto/update-message.args';
import { PaginatedMessages } from './messages-pagination.model';
import { Message } from './message.model';
import { MessagesService } from './messages.service';
import { Chat } from 'src/chats/chat.model';

@UseGuards(Jwt2faGuard)
@Resolver(() => Message)
export class MessagesResolver {
  constructor(
    private messagesService: MessagesService,
    private pubSub: PubSubProvider,
  ) {}

  @Query(() => PaginatedMessages, { name: 'messages' })
  getMessages(
    @Args() getMessagesArgs: GetMessagesArgs,
  ): Promise<IPaginated<Message>> {
    return this.messagesService.getMessages(getMessagesArgs);
  }

  @Subscription(() => Message, {
    nullable: true,
    filter(payload, variables, context) {
      return payload.messageCreated.usersIds.includes(variables.userId);
    },
    resolve(payload, args, context, info) {
      return payload.messageCreated.payload;
    },
  })
  messageCreated(@Args('userId') userId: string) {
    return this.pubSub.asyncIterator(PubSubTrigger.MESSAGE_CREATED);
  }

  @Subscription(() => [Message], {
    filter(payload, variables, context) {
      return payload.messageUpdated.usersIds.includes(variables.userId);
    },
    resolve(payload, args, context, info) {
      return payload.messageUpdated.payload;
    },
  })
  messageUpdated(@Args('userId') userId: string) {
    return this.pubSub.asyncIterator(PubSubTrigger.MESSAGE_UPDATED);
  }

  @Mutation(() => Message)
  async createMessage(
    @Args() args: CreateMessageArgs,
    @CurrentUser() author: User,
  ): Promise<Message> {
    const messageData = await this.messagesService.createMessage({
      ...args,
      author,
    });
    this.pubSub.publish('MESSAGE_CREATED', {
      messageCreated: messageData,
    });
    return messageData.payload;
  }

  @Mutation(() => Message)
  async readMessages(
    @CurrentUser() user: User,
    @Args('messagesIds', { type: () => [String] }) messagesIds: string[],
  ): Promise<Message> {
    const messages = await this.messagesService.readMessages(messagesIds, user);

    this.pubSub.publish(PubSubTrigger.MESSAGE_UPDATED, {
      messageUpdated: {
        payload: messages.payload.messages,
        usersIds: messages.usersIds,
      },
    });

    return messages.payload.message;
  }

  @Mutation(() => Message)
  async upateMessage(
    @CurrentUser() user: User,
    @Args() args: UpdateMessageArgs,
  ): Promise<Message> {
    const message = await this.messagesService.updateMessage({ ...args, user });
    this.pubSub.publish(PubSubTrigger.MESSAGE_UPDATED, {
      messageUpdated: message,
    });
    return message;
  }

  @ResolveField('chat', () => Chat)
  getChat(@Parent() parent: Message): Promise<Chat> {
    return this.messagesService.getChat(parent.id);
  }

  @ResolveField('author', () => User)
  getAuthor(@Parent() parent: Message): Promise<User> {
    return this.messagesService.getAuthor(parent.id);
  }

  @ResolveField('usersSeen', () => [User])
  getUsersSeen(@Parent() parent: Message): Promise<User[]> {
    return this.messagesService.getUsersSeen(parent.id);
  }
}
