import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesModule } from 'src/messages/messages.module';
import { PubSubProvider } from 'src/pub-sub';
import { UploadsModule } from 'src/uploads/uploads.module';
import { UsersModule } from 'src/users/users.module';
import { Chat } from './chat.model';
import { ChatsResolver } from './chats.resolver';
import { ChatsService } from './chats.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat]),
    UsersModule,
    forwardRef(() => MessagesModule),
    UploadsModule,
  ],
  providers: [ChatsResolver, ChatsService, PubSubProvider],
  exports: [ChatsService],
})
export class ChatsModule {}
