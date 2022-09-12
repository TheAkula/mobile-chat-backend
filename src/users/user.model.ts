import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { format } from 'date-fns';
import { Chat } from 'src/chats/chat.model';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AuthStatus {
  NotAuthenticated = 'NotAuthenticated',
  HaveProfile = 'HaveProfile',
  HaveAccount = 'HaveAccount',
  Authenticated = 'Authenticated',
}

registerEnumType(AuthStatus, {
  name: 'AuthStatus',
});

@ObjectType({ isAbstract: true })
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Field()
  id: string;

  @Column({ default: false })
  is2faEnabled: boolean;

  @Column({ nullable: true })
  @Field({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  lastName?: string;

  @Column({ default: false })
  @Field()
  isActive: boolean;

  @ManyToMany(() => Chat, (chat) => chat.users)
  @Field(() => [Chat], { defaultValue: [] })
  chats: Chat[];

  @Column()
  @Field()
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  salt?: string;

  @ManyToMany(() => User)
  @JoinTable()
  @Field(() => [User], { defaultValue: [] })
  friends: User[];

  @Column({ nullable: true })
  @Field({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  twoFactorAuthenticationSecret?: string;

  @Column({
    default: AuthStatus.NotAuthenticated,
    enum: AuthStatus,
    type: 'enum',
  })
  @Field(() => AuthStatus)
  authStatus: AuthStatus;

  @Column({ default: format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS') })
  @Field()
  lastSeen: string;

  @Field({ nullable: true })
  isFriend: boolean;
}
