import {
  EventSubscriber,
  EntitySubscriberInterface,
  DataSource,
  InsertEvent,
  Not,
  Like,
} from 'typeorm';
import { Message } from './message.model';

@EventSubscriber()
export class MessageSubscriber implements EntitySubscriberInterface<Message> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Message;
  }

  async afterInsert(event: InsertEvent<Message>) {
    const messages = await event.manager.find(Message, {
      where: {
        chat: {
          id: event.entity.chat.id,
        },
        usersSeen: Not(Like(event.entity.author.id)),
      },
      relations: {
        usersSeen: true,
      },
    });

    if (messages) {
      const updatedMessages = messages.map((message) => {
        return {
          ...message,
          usersSeen: [...message.usersSeen, event.entity.author],
        };
      });

      return event.manager.save(Message, updatedMessages);
    }
  }
}
