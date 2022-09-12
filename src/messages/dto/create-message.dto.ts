import { User } from 'src/users/user.model';

export class CreateMessageDto {
  content: string;
  chatId: string;
  author: User;
}
