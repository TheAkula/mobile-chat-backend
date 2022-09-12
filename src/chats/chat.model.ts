import { Message } from '../messages/message.model';
import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne,
} from 'typeorm';
import { User } from 'src/users/user.model';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Entity()
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  @Field()
  id: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  name: string;

  @OneToMany(() => Message, (message) => message.chat)
  @Field(() => [Message])
  messages: Message[];

  @ManyToMany(() => User, (user) => user.chats)
  @JoinTable()
  @Field(() => [User])
  users: User[];

  @Field(() => User, { nullable: true })
  friend: User;

  @Column({ default: false })
  @Field({ defaultValue: false })
  isFriendsChat: boolean;

  @Column({ nullable: true })
  @Field({ nullable: true })
  imgUrl: string;

  @Field()
  notSeen: number;

  @Column({ nullable: true })
  adminId: string;

  @ManyToOne(() => User, { nullable: true })
  @Field(() => User, { nullable: true })
  admin: User;
}
