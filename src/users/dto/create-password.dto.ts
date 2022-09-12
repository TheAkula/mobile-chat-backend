import { User } from '../user.model';
import { CreatePasswordArgs } from './create-password.args';

export class CreatePasswordDto extends CreatePasswordArgs {
  user: User;
}
