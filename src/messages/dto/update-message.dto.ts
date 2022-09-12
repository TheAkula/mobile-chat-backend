import { User } from 'src/users/user.model';
import { UpdateMessageArgs } from './update-message.args';

export class UpdateMessageDto extends UpdateMessageArgs {
  user: User;
}
