import { UseGuards } from '@nestjs/common';
import {
  Mutation,
  Parent,
  Query,
  ResolveField,
  Subscription,
} from '@nestjs/graphql';
import { Args, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Jwt2faGuard } from 'src/auth/jwt2fa.guard';
import { Chat } from 'src/chats/chat.model';
import { PubSubTrigger } from 'src/enums';
import { PubSubProvider } from 'src/pub-sub';
import { IPaginated } from 'src/types';
import { CreatePasswordArgs } from './dto/create-password.args';
import { CreateProfileArgs } from './dto/create-profile.args';
import { GetUsersArgs } from './dto/get-users.args';
import { UpdateUserArgs } from './dto/update-user.args';
import { User } from './user.model';
import { PaginatedUsers } from './users-pagination.model';
import { UsersService } from './users.service';

@UseGuards(Jwt2faGuard)
@Resolver(() => User)
export class UsersResolver {
  constructor(
    private usersService: UsersService,
    private pubSub: PubSubProvider,
  ) {}

  @Query(() => PaginatedUsers, { name: 'users' })
  getUsers(
    @CurrentUser() user: User,
    @Args() args: GetUsersArgs,
  ): Promise<IPaginated<User>> {
    return this.usersService.getUsers({ ...args, userId: user.id });
  }

  @Query(() => User, { name: 'user' })
  getUser(@Args('id') id: string): Promise<User> {
    return this.usersService.getUser(id);
  }

  @Query(() => User)
  myUserInfo(@CurrentUser() user: User): User {
    return user;
  }

  @Query(() => [User])
  myFriends(@CurrentUser() user: User): Promise<User[]> {
    return this.usersService.getFriends(user.id);
  }

  @Mutation(() => User)
  createProfile(
    @CurrentUser() user: User,
    @Args() createProfileArgs: CreateProfileArgs,
  ): Promise<User> {
    return this.usersService.createProfile({ ...createProfileArgs, user });
  }

  @Mutation(() => User)
  createUserPassword(
    @CurrentUser() user: User,
    @Args() createUserPasswordArgs: CreatePasswordArgs,
  ): Promise<User> {
    return this.usersService.createUserPassword({
      ...createUserPasswordArgs,
      user,
    });
  }

  @Mutation(() => User)
  activate(@CurrentUser() user: User): Promise<User> {
    return this.usersService.updateUserSeen(user, true);
  }

  @Mutation(() => User)
  addFriend(
    @CurrentUser() user: User,
    @Args('friendId') friendId: string,
  ): Promise<User> {
    return this.usersService.addFriend(user, friendId);
  }

  @Mutation(() => User)
  removeFriend(
    @Args('id') id: string,
    @CurrentUser() user: User,
  ): Promise<User> {
    return this.usersService.removeFriend(id, user.id);
  }

  @Mutation(() => User)
  updateUser(
    @CurrentUser() user: User,
    @Args() args: UpdateUserArgs,
  ): Promise<User> {
    return this.usersService.updateUser(args, user);
  }

  @Mutation(() => User)
  goOut(@CurrentUser() user: User): Promise<User> {
    return this.usersService.updateUserSeen(user, false);
  }

  @Subscription(() => User, {
    filter(payload) {
      return true;
    },
  })
  userActivityChanged() {
    return this.pubSub.asyncIterator(PubSubTrigger.USER_ACTIVITY_CHANGED);
  }

  @ResolveField('chats', () => [Chat])
  getChats(@Parent() parent: User): Promise<Chat[]> {
    return this.usersService.getChats(parent.id);
  }

  @ResolveField('friends', () => [User])
  getFriends(@Parent() user: User): Promise<User[]> {
    return this.usersService.getFriends(user.id);
  }

  @ResolveField('isFriend', () => Boolean)
  getIsFriend(
    @Parent() user: User,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    return this.usersService.getIsFriend(user.id, currentUser.id);
  }
}
