import {
  Injectable,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from 'src/chats/chat.model';
import { Chat as ChatModel } from './chat.model';
import { Repository } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/user.model';
import { CreatePersonalChatDto } from './dto/create-personal-chat.dto';
import { UploadsService } from 'src/uploads/uploads.service';
import { AddToChatDto } from './dto/add-to-chat.dto';
import { RemoveFromChatDto } from './dto/remove-from-chat.dto';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat) private chatsRepository: Repository<Chat>,
    private usersSerive: UsersService,
    private uploadsService: UploadsService,
  ) {}

  async createPersonalChat({ user, id }: CreatePersonalChatDto): Promise<Chat> {
    const friend = await this.usersSerive.findUserById(id);

    if (!friend) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    const chat = await this.chatsRepository
      .createQueryBuilder('chat')
      .where('chat.isFriendsChat = true')
      .innerJoin('chat.users', 'user', 'user.id = :id', {
        id: user.id,
      })
      .innerJoin('chat.users', 'friend', 'friend.id = :friendId', {
        friendId: id,
      })
      .getOne();

    if (chat) {
      return chat;
    }

    const newChat = this.chatsRepository.create({
      users: [user, friend],
      isFriendsChat: true,
    });

    return await this.chatsRepository.save(newChat);
  }

  async createChat({
    user,
    name,
    image,
    imageExt,
  }: CreateChatDto): Promise<Chat> {
    let imgUrl: string;
    if (image && imageExt) {
      imgUrl = await this.uploadsService.uploadFile(image, imageExt);
    }

    const chat = this.chatsRepository.create({
      name,
      users: [user],
      imgUrl,
      admin: user,
    });

    return this.chatsRepository.save(chat);
  }

  async getUsers(id: string): Promise<User[]> {
    const chat = await this.findChat(id, ['users']);
    if (!chat) {
      throw new NotFoundException(`Chat with id "${id}" not found`);
    }
    return chat.users;
  }

  async findChat(id: string, relations?: string[]): Promise<ChatModel> {
    return this.chatsRepository.findOne({ where: { id }, relations });
  }

  async getFriend(chatId: string, userId: string): Promise<User> {
    const chat = await this.chatsRepository.findOne({
      where: { id: chatId },
      relations: ['users'],
    });
    if (!chat.isFriendsChat) {
      return null;
    }
    if (!chat) {
      throw new NotFoundException(`Chat with id "${chatId}" not found`);
    }

    const user = chat.users.find((user) => user.id === userId);

    if (!user) {
      return null;
    }

    return chat.users.find((user) => user.id !== userId);
  }

  async getFriendsChats(id: string): Promise<Chat[]> {
    return this.chatsRepository
      .createQueryBuilder('chat')
      .where('chat.isFriendsChat = true')
      .innerJoin('chat.users', 'user', 'user.id = :userId', { userId: id })
      .getMany();
  }

  async getMyChats(user: User): Promise<Chat[]> {
    return this.chatsRepository
      .createQueryBuilder('chat')
      .innerJoin('chat.users', 'user', 'user.id = :id', { id: user.id })
      .getMany();
  }

  async getAdmin(chatId: string): Promise<User> {
    const chat = await this.findChat(chatId, ['admin']);
    return chat.admin;
  }

  async addToChat({
    chatId,
    currentUserId,
    userId,
  }: AddToChatDto): Promise<Chat> {
    const user = await this.usersSerive.findUserById(userId);

    const chat = await this.findChat(chatId);

    if (chat.adminId !== currentUserId) {
      throw new MethodNotAllowedException();
    }

    await this.chatsRepository
      .createQueryBuilder('chat')
      .relation(Chat, 'users')
      .of(chat)
      .add(user);

    return chat;
  }

  async removeFromChat({
    userId,
    chatId,
    currentUserId,
  }: RemoveFromChatDto): Promise<Chat> {
    const user = await this.usersSerive.findUserById(userId);

    const chat = await this.findChat(chatId);

    if (chat.adminId !== currentUserId) {
      throw new MethodNotAllowedException();
    }

    await this.chatsRepository
      .createQueryBuilder('chat')
      .relation(Chat, 'users')
      .of(chat)
      .remove(user);

    return chat;
  }
}
