import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { UsersModule } from './users/users.module';
import { ChatsModule } from './chats/chats.module';
import { MessagesModule } from './messages/messages.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getMailConfig, getTypeormConfig } from './config';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getTypeormConfig,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      cache: 'bounded',
      introspection: true,
      subscriptions: {
        'graphql-ws': true,
      },
      playground: {
        endpoint: 'http://172.17.0.1:4000/graphql',
        subscriptionEndpoint: 'ws://172.17.0.1:4000/graphql',
      },
      context: async ({ req, connectionParams }) => {
        if (connectionParams && !req) {
          return {
            req: { headers: { ...connectionParams } },
          };
        }
        return { req };
      },
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getMailConfig,
    }),
    UsersModule,
    ChatsModule,
    MessagesModule,
    AuthModule,
    UploadsModule,
  ],
})
export class AppModule {}
