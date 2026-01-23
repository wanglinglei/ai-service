export interface AccountData {
  env: string;
  env_label: string;
  username: string;
  password: string;
}

export interface GroupedAccount {
  label: string;
  value: string;
  data: AccountData[];
}
