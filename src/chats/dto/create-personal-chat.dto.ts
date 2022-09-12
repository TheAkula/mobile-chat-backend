import { User } from 'src/users/user.model';

export class CreatePersonalChatDto {
  user: User;
  id: string;
}
