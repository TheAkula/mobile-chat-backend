import { User } from '../user.model';
import { CreateProfileArgs } from './create-profile.args';

export class CreateProfileDto extends CreateProfileArgs {
  user: User;
}
