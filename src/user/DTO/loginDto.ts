export interface LoginDto {
  username: string;
  password: string;
  captcha: string;
}

export interface EmailLoginDto {
  email: string;
  emailCode: string;
}
