import {
  BadRequestException,
  Injectable,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import { Chat } from 'src/chats/chat.model';
import { ChatsFilter } from 'src/chats/chats-filter.input';
import { ChatsService } from 'src/chats/chats.service';
import { OrderDirection } from 'src/enums';
import { IPaginated, ResultSubscription } from 'src/types';
import { User } from 'src/users/user.model';
import { UsersService } from 'src/users/users.service';
import { LessThanOrEqualDate } from 'src/utils';
import {
  In,
  Like,
  MoreThanOrEqual,
  Not,
  Repository,
  LessThanOrEqual,
  LessThan,
} from 'typeorm';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesArgs, MessageOrderBy } from './dto/get-messages.args';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message } from './message.model';
import { ReadMessagesResult } from './types';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private messagesRepository: Repository<Message>,
    private chatsService: ChatsService,
    private usersService: UsersService,
  ) {}

  async getMessages({
    id,
    filter,
    page = 0,
    skip = 0,
  }: GetMessagesArgs): Promise<IPaginated<Message>> {
    const {
      orderBy = MessageOrderBy.createdAt,
      orderDirection = OrderDirection.DESC,
      take = 50,
    } = filter || {};
    const [messages, total] = await this.messagesRepository.findAndCount({
      where: { chatId: id },
      loadRelationIds: {
        relations: ['usersSeen', 'author'],
      },
      order: {
        [orderBy]: orderDirection,
      },
      skip: skip + page * take,
      take,
    });

    const count = page * take + skip;
    const nextPage =
      total - count <= 0 || messages.length === total ? null : page + 1;

    return {
      data: messages,
      nextPage: nextPage,
    };
  }

  async createMessage({
    content,
    chatId,
    author,
  }: CreateMessageDto): Promise<ResultSubscription<Message>> {
    const chat = await this.chatsService.findChat(chatId, ['users']);

    if (!chat) {
      throw new NotFoundException(`Chat with id "${chatId}" not found`);
    }

    const isUserInChat = chat.users.find((u) => u.id === author.id);

    if (!isUserInChat) {
      throw new MethodNotAllowedException(
        `User with id ${author.id} does not exist in this chat`,
      );
    }

    const users = await this.usersService.getMessageUsers(chatId);
    const usersIds = users.map((user) => user.id);

    const message = this.messagesRepository.create({
      content,
      chat,
      author,
      usersSeen: [author],
    });

    const createdMessage = await this.messagesRepository.save(message);

    return {
      payload: {
        ...createdMessage,
      },
      usersIds,
    };
  }

  async getChat(id: string): Promise<Chat> {
    const message = await this.messagesRepository.findOne({
      where: { id },
      relations: ['chat'],
    });
    return message.chat as Chat;
  }

  async getAuthor(id: string) {
    const message = await this.messagesRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    return message.author;
  }

  async getChatsMessages(id: string, filter: ChatsFilter): Promise<Message[]> {
    return this.messagesRepository
      .createQueryBuilder('message')
      .innerJoin('message.chat', 'chat', 'chat.id = :chatId', { chatId: id })
      .orderBy('message.createdAt', 'DESC')
      .take(filter?.messagesAmount || 0)
      .getMany();
  }

  async getUsersSeen(id: string): Promise<User[]> {
    return (
      await this.messagesRepository
        .createQueryBuilder('message')
        .where('message.id = :messageId', { messageId: id })
        .leftJoinAndSelect('message.usersSeen', 'userSeen')
        .getOne()
    ).usersSeen;
  }

  async getNotSeenCount(chatId: string, user: User): Promise<number> {
    const messages = await this.messagesRepository.find({
      where: { chat: { id: chatId }, author: { id: Not(user.id) } },
      relations: { usersSeen: true },
    });

    const count = messages.reduce((prev, cur) => {
      const exUser = cur.usersSeen.find((u) => u.id === user.id);
      if (exUser) {
        return prev;
      }
      return prev + 1;
    }, 0);

    return count;
  }

  async readMessages(
    messagesIds: string[],
    user: User,
  ): Promise<ResultSubscription<ReadMessagesResult>> {
    const messages = await this.messagesRepository.find({
      where: { id: In(messagesIds) },
      relations: { usersSeen: true },
    });

    const message = messages.reduce((prev, cur) => {
      if (new Date(prev.createdAt) < new Date(cur.createdAt)) {
        return cur;
      }

      return prev;
    });

    const chats: string[] = [];

    messages.forEach((msg) => {
      chats.push(msg.chatId);
    });

    if (new Set(chats).size > 1) {
      throw new BadRequestException(`More then 1 chat`);
    }

    const messagesToUpdate = await this.messagesRepository.find({
      where: {
        createdAt: LessThan(message.createdAt),
        chat: {
          id: chats[0],
        },
      },
      relations: {
        usersSeen: true,
      },
    });

    const filteredMessages = messagesToUpdate
      .concat(message)
      .filter((message) => {
        const exUser = message.usersSeen.find((u) => u.id === user.id);

        return !exUser;
      });

    await this.messagesRepository
      .createQueryBuilder()
      .relation(Message, 'usersSeen')
      .of(filteredMessages)
      .add(user);

    const chat = await this.chatsService.findChat(chats[0], ['users']);

    const usersIds = chat.users.map((user) => user.id);

    return {
      payload: {
        messages: filteredMessages,
        message: message,
      },
      usersIds,
    };
  }

  async findMessage(messageId: string, relations?: string[]): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
      relations: relations,
    });

    if (!message) {
      throw new NotFoundException(`Message with id ${messageId} not found`);
    }

    return message;
  }

  async updateMessage({
    messageId,
    user,
    ...rest
  }: UpdateMessageDto): Promise<Message> {
    const message = await this.findMessage(messageId);
    if (message.authorId !== user.id) {
      throw new MethodNotAllowedException();
    }
    return this.messagesRepository.save({
      ...message,
      ...rest,
    });
  }
}
