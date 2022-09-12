import { Message } from './message.model';

export interface ReadMessagesResult {
  messages: Message[];
  message: Message;
}
