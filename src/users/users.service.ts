import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthStatus, User } from 'src/users/user.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserArgs } from './dto/update-user.args';
import { format } from 'date-fns';
import { UploadsService } from 'src/uploads/uploads.service';
import { pbkdf2Sync, randomBytes } from 'crypto';
import { GetUsersDto } from './dto/get-users.dto';
import { UsersOrderBy } from './dto/get-users.args';
import { OrderDirection, PubSubTrigger } from 'src/enums';
import { IPaginated } from 'src/types';
import { PubSubProvider } from 'src/pub-sub';
import { Chat } from 'src/chats/chat.model';
import { CreateProfileDto } from './dto/create-profile.dto';
import { CreatePasswordDto } from './dto/create-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private uploadsService: UploadsService,
    private pubSub: PubSubProvider,
  ) {}

  checkPassword(password: string, salt: string, userPassword: string): boolean {
    const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return userPassword === hash;
  }

  createPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString('hex');

    return {
      salt,
      hash,
    };
  }

  async getUser(id: string): Promise<User> {
    const user = await this.findUserById(id);

    return user;
  }

  async findUserById(id: string): Promise<User> {
    return await this.userRepository.findOneBy({ id });
  }

  async findUserWithRelation(id: string, relation: string): Promise<User> {
    return await this.userRepository.findOne({
      where: { id },
      relations: [relation],
    });
  }

  async findUserByEmail(email: string): Promise<User> {
    return await this.userRepository.findOneBy({ email });
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.userRepository.create({
      ...createUserDto,
      authStatus: AuthStatus.HaveAccount,
    });
    return await this.userRepository.save(newUser);
  }

  async createUserWith2fa(email: string): Promise<User> {
    const user = this.findUserByEmail(email);

    if (!user) {
      throw new BadRequestException(`User with email "${email}" already exist`);
    }

    const newUser = this.userRepository.create({
      email,
      is2faEnabled: true,
    });

    return this.userRepository.save(newUser);
  }

  async getChats(id: string): Promise<Chat[]> {
    const user = await this.findUserWithRelation(id, 'chats');
    if (!user) {
      throw new NotFoundException(`User with id "${id} not found"`);
    }
    return user.chats;
  }

  async getMessageUsers(id: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .select('user.id')
      .innerJoin('user.chats', 'chat', 'chat.id = :id', { id })
      .getMany();
  }

  async getFriends(id: string): Promise<User[]> {
    const users = await this.userRepository.find({
      where: {
        friends: {
          id,
        },
      },
    });

    return users;
  }

  async addFriend(user: User, friendId: string): Promise<User> {
    const friend = await this.findUserById(friendId);
    if (!friend) {
      throw new NotFoundException(`User with id "${friendId}" not found`);
    }

    await this.userRepository
      .createQueryBuilder('user')
      .relation(User, 'friends')
      .of(user)
      .add(friend);

    await this.userRepository
      .createQueryBuilder('user')
      .relation(User, 'friends')
      .of(friend)
      .add(user);

    return friend;
  }

  async setTwoFactorAuthenticationSecret(secret: string, id: string) {
    return this.userRepository.update(id, {
      twoFactorAuthenticationSecret: secret,
    });
  }

  async createProfile({
    user,
    firstName,
    lastName,
    upload,
  }: CreateProfileDto): Promise<User> {
    if (user.authStatus !== AuthStatus.Authenticated) {
      throw new BadRequestException();
    }

    let imgUrl: string;
    if (upload) {
      imgUrl = await this.uploadsService.uploadFile(upload.base64, upload.ext);
    }

    const updatedFields = {
      firstName,
      lastName,
      avatar: imgUrl,
      authStatus: AuthStatus.HaveProfile,
    };

    await this.userRepository.save({
      id: user.id,
      ...updatedFields,
    });

    return {
      ...user,
      ...updatedFields,
    };
  }

  async createUserPassword({
    password,
    user,
  }: CreatePasswordDto): Promise<User> {
    if (user.authStatus !== AuthStatus.HaveProfile) {
      throw new BadRequestException();
    }

    const { salt, hash } = this.createPassword(password);

    await this.userRepository.save({
      ...user,
      salt,
      password: hash,
      authStatus: AuthStatus.HaveAccount,
    });

    return {
      ...user,
      authStatus: AuthStatus.HaveAccount,
    };
  }

  async updateUser(
    { avatar, avatarExt, password, ...rest }: UpdateUserArgs,
    user: User,
  ): Promise<User> {
    let av: string;
    let pass: { salt: string; hash: string };
    if (avatar) {
      av = await this.uploadsService.uploadFile(avatar, avatarExt);
    }

    if (password) {
      pass = this.createPassword(password);
    }

    const updatedUser: Partial<User> = {
      ...rest,
      id: user.id,
      avatar: av,
    };

    if (pass) {
      updatedUser.salt = pass.salt;
      updatedUser.password = pass.hash;
    }

    const data = await this.userRepository.save(updatedUser);

    return {
      ...user,
      ...data,
    };
  }

  authenticateUser(userId: string) {
    return this.userRepository.update(userId, {
      authStatus: AuthStatus.Authenticated,
    });
  }

  async updateUserSeen(user: User, active: boolean): Promise<User> {
    const date = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');

    await this.userRepository.save({
      id: user.id,
      isActive: active,
      lastSeen: date,
    });

    const updatedUser = {
      ...user,
      isActive: active,
      lastSeen: date,
    };

    this.pubSub.publish(PubSubTrigger.USER_ACTIVITY_CHANGED, {
      userActivityChanged: updatedUser,
    });

    return updatedUser;
  }

  async getUsers({
    userId,
    filter,
    page,
    skip,
  }: GetUsersDto): Promise<IPaginated<User>> {
    const {
      take = 30,
      orderBy = UsersOrderBy.firstName,
      orderDirection = OrderDirection.ASC,
      name = undefined,
    } = filter || {};

    let query = this.userRepository
      .createQueryBuilder('user')
      .where('user.id <> :userId and user.authStatus = :authStatus', {
        userId,
        authStatus: AuthStatus.HaveAccount,
      })
      .orderBy(`user.${orderBy}`, orderDirection)
      .take(take)
      .skip(skip + take * page);

    if (name) {
      query = query.andWhere(
        new Brackets((qb) => {
          qb.where(
            'LOWER(user.firstName) like LOWER(:name) or LOWER(user.lastName) like LOWER(:name) or LOWER(CONCAT(user.firstName, user.lastName)) like LOWER(:name)',
            { name: `%${name.split(' ').join('')}%` },
          );
        }),
      );
    }

    const [users, total] = await query.getManyAndCount();

    const count = page * take + skip;
    const nextPage =
      total - count <= 0 || users.length === total ? null : page + 1;

    return {
      data: users,
      nextPage: nextPage,
    };
  }

  async removeFriend(id: string, userId: string): Promise<User> {
    const user = await this.findUserWithRelation(userId, 'friends');

    const friend = await this.userRepository.findOneBy({ id });

    if (!friend) {
      throw new NotFoundException(`Friend with id ${id} does not exist`);
    }

    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'friends')
      .of(user)
      .remove(friend);
    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'friends')
      .of(friend)
      .remove(user);

    return friend;
  }

  async getIsFriend(userId: string, currentUserId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: currentUserId },
      loadRelationIds: {
        relations: ['friends'],
      },
    });

    const friends = user.friends as unknown as string[];

    return friends.includes(userId);
  }
}
