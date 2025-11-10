import { Gender } from '../entitys/user.entity';

export interface UpdateUserDto {
  id: number;
  username?: string;
  nickname?: string;
  email?: string;
  avatar?: string;
  gender?: Gender;
  province?: string;
  city?: string;
  emailCode?: string;
}
