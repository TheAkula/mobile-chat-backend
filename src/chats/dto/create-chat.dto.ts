import { User } from 'src/users/user.model';
import { CreateChatArgs } from './create-chat.args';

export class CreateChatDto extends CreateChatArgs {
  user: User;
}
