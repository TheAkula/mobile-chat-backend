import { Module } from '@nestjs/common';
import { User } from 'src/users/user.model';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadsModule } from 'src/uploads/uploads.module';
import { PubSubProvider } from 'src/pub-sub';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UploadsModule],
  providers: [UsersResolver, UsersService, PubSubProvider],
  exports: [UsersService],
})
export class UsersModule {}
