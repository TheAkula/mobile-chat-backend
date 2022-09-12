import { Field, ObjectType } from '@nestjs/graphql';
import { Chat } from 'src/chats/chat.model';
import { User } from 'src/users/user.model';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@ObjectType()
@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  @Field()
  id: string;

  @Column({ nullable: true })
  @Field()
  authorId: string;

  @ManyToOne(() => User)
  @Field(() => User)
  author: User;

  @Column()
  @Field()
  content: string;

  @Column({ nullable: true })
  chatId: string;

  @ManyToOne(() => Chat, (chat) => chat.messages, {
    createForeignKeyConstraints: false,
  })
  @Field(() => Chat)
  chat: Chat;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: Date;

  @ManyToMany(() => User, {
    cascade: true,
  })
  @JoinTable()
  @Field(() => [User])
  usersSeen: User[];
}
