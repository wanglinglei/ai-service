export interface AuthResponseDto {
  access_token: string;
  user: {
    id: number;
    username: string;
    nickname: string;
    email?: string;
    avatar?: string;
  };
}
