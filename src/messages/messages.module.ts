import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './message.model';
import { MessagesService } from './messages.service';
import { MessagesResolver } from './messages.resolver';
import { ChatsModule } from 'src/chats/chats.module';
import { PubSubProvider } from 'src/pub-sub';
import { UsersModule } from 'src/users/users.module';
import { MessageSubscriber } from './message.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    forwardRef(() => ChatsModule),
    UsersModule,
  ],
  providers: [
    MessagesService,
    MessagesResolver,
    PubSubProvider,
    MessageSubscriber,
  ],
  exports: [MessagesService],
})
export class MessagesModule {}
