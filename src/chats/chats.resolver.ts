import { UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
  Query,
  Subscription,
  Int,
} from '@nestjs/graphql';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Jwt2faGuard } from 'src/auth/jwt2fa.guard';
import { Message } from 'src/messages/message.model';
import { MessagesService } from 'src/messages/messages.service';
import { PubSubProvider } from 'src/pub-sub';
import { User } from 'src/users/user.model';
import { Chat } from './chat.model';
import { ChatsFilter } from './chats-filter.input';
import { ChatsService } from './chats.service';
import { AddToChatArgs } from './dto/add-to-chat.args';
import { CreateChatArgs } from './dto/create-chat.args';
import { CreatePersonalChatArgs } from './dto/create-personal-chat.args';
import { RemoveFromChatArgs } from './dto/remove-from-chat.args';

@UseGuards(Jwt2faGuard)
@Resolver(() => Chat)
export class ChatsResolver {
  constructor(
    private chatsService: ChatsService,
    private pubSub: PubSubProvider,
    private messagesService: MessagesService,
  ) {}

  @Query(() => [Chat], { name: 'myChats' })
  async getMyChats(@CurrentUser() user: User): Promise<Chat[]> {
    const mainChats = await this.chatsService.getMyChats(user);

    return mainChats;
  }

  @Query(() => Chat, { name: 'chat' })
  getChat(@Args('chatId') chatId: string): Promise<Chat> {
    return this.chatsService.findChat(chatId);
  }

  @Mutation(() => Chat)
  async createPersonalChat(
    @Args() args: CreatePersonalChatArgs,
    @CurrentUser() user: User,
  ): Promise<Chat> {
    return this.chatsService.createPersonalChat({ ...args, user });
  }

  @Mutation(() => Chat)
  async createChat(
    @Args() args: CreateChatArgs,
    @CurrentUser() user: User,
  ): Promise<Chat> {
    const newChat = await this.chatsService.createChat({ ...args, user });
    this.pubSub.publish('CHAT_CREATED', { chatCreated: newChat });
    return newChat;
  }

  @Mutation(() => Chat)
  addToChat(
    @Args() args: AddToChatArgs,
    @CurrentUser() user: User,
  ): Promise<Chat> {
    return this.chatsService.addToChat({ ...args, currentUserId: user.id });
  }

  @Mutation(() => Chat)
  removeFromChat(
    @Args() args: RemoveFromChatArgs,
    @CurrentUser() user: User,
  ): Promise<Chat> {
    return this.chatsService.removeFromChat({
      ...args,
      currentUserId: user.id,
    });
  }

  @Subscription(() => Chat, {
    filter(payload, variables, context) {
      return payload.chatCreated.users
        .map((user) => user.id)
        .includes(variables.userId);
    },
  })
  chatCreated(@Args('userId') userId: string) {
    return this.pubSub.asyncIterator('CHAT_CREATED');
  }

  @ResolveField('users', () => [User])
  getUsers(@Parent() parent: Chat): Promise<User[]> {
    return this.chatsService.getUsers(parent.id);
  }

  @ResolveField('messages', () => [Message])
  getMessages(
    @Parent() parent: Chat,
    @Args('filter', { nullable: true }) filter: ChatsFilter,
  ): Promise<Message[]> {
    return this.messagesService.getChatsMessages(parent.id, filter);
  }

  @ResolveField('friend', () => User, { nullable: true })
  getFriend(@Parent() parent: Chat, @CurrentUser() user: User): Promise<User> {
    return this.chatsService.getFriend(parent.id, user.id);
  }

  @ResolveField('notSeen', () => Int)
  getNotSeen(
    @Parent() parent: Chat,
    @CurrentUser() user: User,
  ): Promise<number> {
    return this.messagesService.getNotSeenCount(parent.id, user);
  }

  @ResolveField('admin', () => User, { nullable: true })
  getAdmin(@Parent() parent: Chat): Promise<User> {
    return this.chatsService.getAdmin(parent.id);
  }
}
